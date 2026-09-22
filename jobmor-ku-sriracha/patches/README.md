# Dependency security compatibility

`decode-uri-component` is pinned to 0.5.0 to fix GHSA-vcc3-ghjq-m6fr.
Expo Router 57 uses CommonJS `query-string@7.1.3`; its decoder import must access
the new ESM default export. The small patch preserves legacy plus-as-space
decoding as well. `npm ci` applies it via `postinstall` and fails if it no longer
applies. Do not install with `--ignore-scripts` for application builds.

`xcode` uses `uuid.v4()` and is overridden to 11.1.1, fixing GHSA-w5hq-g745-h8pq
while retaining CommonJS support. Tests exercise URL parsing, malformed inputs,
and xcode ID generation. Keep these pins until compatible upstream releases
remove the vulnerable dependency ranges; then remove the overrides and patch
together and rerun the tests and Expo exports.
