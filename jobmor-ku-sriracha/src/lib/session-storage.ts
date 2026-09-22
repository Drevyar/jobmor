type Store = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
type Manifest = { generation: string; count: number };
let sequence = 0;

// Small chunks avoid native Keychain payload limits, including Unicode metadata.
// Supabase serializes its session operations; publish the manifest only after all
// chunks are durable so a failed write never replaces a working session.
export function createSessionStorage(secure: Store, legacy: Store): Store {
  const manifestKey = (key: string) => `${key}.secure-v1`;
  const chunkKey = (key: string, manifest: Manifest, index: number) => `${manifestKey(key)}.${manifest.generation}.${index}`;
  async function readManifest(key: string): Promise<Manifest | null> {
    const raw = await secure.getItem(manifestKey(key));
    if (!raw) return null;
    const value = JSON.parse(raw) as Manifest;
    if (!/^[0-9-]+$/.test(value.generation) || !Number.isInteger(value.count) || value.count < 1 || value.count > 10000) {
      throw new Error('Invalid secure session storage');
    }
    return value;
  }
  async function clearChunks(key: string, manifest: Manifest | null) {
    if (!manifest) return;
    await Promise.all(Array.from({ length: manifest.count }, (_, index) => secure.removeItem(chunkKey(key, manifest, index))));
  }
  const storage: Store = {
    async getItem(key) {
      const manifest = await readManifest(key);
      if (manifest) {
        const chunks = await Promise.all(Array.from({ length: manifest.count }, (_, index) => secure.getItem(chunkKey(key, manifest, index))));
        if (chunks.some(chunk => chunk === null)) throw new Error('Incomplete secure session storage');
        // Retry cleanup if an earlier migration was interrupted after publication.
        await legacy.removeItem(key);
        return chunks.join('');
      }
      const previous = await legacy.getItem(key);
      if (previous !== null) await storage.setItem(key, previous);
      return previous;
    },
    async setItem(key, value) {
      // Array.from keeps surrogate pairs together. <= 1600 UTF-8 bytes per chunk.
      const characters = Array.from(value);
      const count = Math.max(1, Math.ceil(characters.length / 400));
      if (count > 10000) throw new Error('Session exceeds secure storage limit');
      const old = await readManifest(key);
      const next = { generation: `${Date.now()}-${++sequence}`, count };
      try {
        for (let index = 0; index < count; index++) {
          await secure.setItem(chunkKey(key, next, index), characters.slice(index * 400, (index + 1) * 400).join(''));
        }
        await secure.setItem(manifestKey(key), JSON.stringify(next));
      } catch (error) {
        await clearChunks(key, next).catch(() => undefined);
        throw error;
      }
      await legacy.removeItem(key);
      await clearChunks(key, old);
    },
    async removeItem(key) {
      const manifest = await readManifest(key);
      // Remove plaintext first so interrupted logout cannot resurrect it.
      await legacy.removeItem(key);
      await secure.removeItem(manifestKey(key));
      await clearChunks(key, manifest);
    },
  };
  return storage;
}
