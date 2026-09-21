import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export function useEmployerText() {
  const { t } = useTranslation();
  return (key: string) => t(`employerFlow.${key}`);
}
export function Copy({ children, strong = false }: PropsWithChildren<{ strong?: boolean }>) {
  const colors = useTheme();
  return <Text style={{ color: colors.text, fontSize: strong ? 18 : 14, fontWeight: strong ? '700' : '400', lineHeight: 23 }}>{children}</Text>;
}
export function Card({ children }: PropsWithChildren) {
  const colors = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}
export function Button({ label, onPress, disabled, danger = false }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  const colors = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={[styles.button, { backgroundColor: colors.surface, borderColor: danger ? colors.danger : colors.primary, opacity: disabled ? 0.5 : 1 }]}>
    <Text style={{ color: danger ? colors.danger : colors.primary, fontWeight: '700' }}>{label}</Text>
  </Pressable>;
}
export function Notice({ text, error = false }: { text: string; error?: boolean }) {
  const colors = useTheme();
  return text ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: error ? colors.danger : colors.primary, lineHeight: 22 }}>{text}</Text> : null;
}
export function LoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  const t = useEmployerText();
  return loading ? <ActivityIndicator accessibilityLabel={t('loading')} /> : error ? <Card><Notice text={t(error)} error /><Button label={t('retry')} onPress={retry} /></Card> : null;
}
export function Field({ label, value, onChange, multiline, numeric, maxLength, disabled }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; numeric?: boolean; maxLength?: number; disabled?: boolean;
}) {
  const colors = useTheme();
  return <View style={styles.field}><Copy>{label}</Copy><TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
    editable={!disabled} multiline={multiline} maxLength={maxLength} keyboardType={numeric ? 'decimal-pad' : 'default'}
    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }, multiline && { minHeight: 110, textAlignVertical: 'top' }]} /></View>;
}
export function Choices({ values, value, onChange, disabled }: { values: readonly string[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const t = useEmployerText(); const colors = useTheme();
  return <View style={styles.row}>{values.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: value === option, disabled: !!disabled }}
    disabled={disabled} onPress={() => onChange(option)} style={[styles.button, { borderColor: colors.border, backgroundColor: value === option ? colors.primarySoft : colors.surface }]}>
    <Text style={{ color: value === option ? colors.primary : colors.text }}>{t(option)}</Text>
  </Pressable>)}</View>;
}
export function DeleteDialog({ visible, busy, error, cancel, confirm }: { visible: boolean; busy: boolean; error: string; cancel: () => void; confirm: () => void }) {
  const t = useEmployerText();
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={() => { if (!busy) cancel(); }}>
    <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal><Card><Copy strong>{t('deleteTitle')}</Copy><Copy>{t('deleteBody')}</Copy>
      <Notice text={error ? t(error) : ''} error /><Button label={busy ? t('saving') : t('delete')} onPress={confirm} danger disabled={busy} />
      <Button label={t('cancel')} onPress={cancel} disabled={busy} /></Card></View></View>
  </Modal>;
}
export const styles = StyleSheet.create({
  card: { padding: 20, borderWidth: 1, borderRadius: 20, gap: 12 },
  button: { minHeight: 44, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, field: { gap: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 14, padding: 14 },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 480 },
});
