import { type PropsWithChildren, useState } from 'react';
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
export function Button({ label, onPress, disabled, danger = false, variant = 'secondary', selected }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean; variant?: 'primary' | 'secondary' | 'ghost'; selected?: boolean }) {
  const colors = useTheme();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const filled = variant === 'primary' && !danger;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress}
    onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.button, {
      backgroundColor: filled ? colors.primary : (hovered || pressed || selected) && !disabled ? colors.primarySoft : variant === 'ghost' ? 'transparent' : colors.surface,
      borderColor: focused ? colors.text : danger ? colors.danger : variant === 'ghost' ? 'transparent' : filled || selected ? colors.primary : colors.border,
      borderWidth: focused ? 2 : 1, opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
    }]}>
    <Text style={{ color: danger ? colors.danger : filled ? colors.onPrimary : colors.primary, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
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
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}><Copy>{label}</Copy><TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
    editable={!disabled} multiline={multiline} maxLength={maxLength} keyboardType={numeric ? 'decimal-pad' : 'default'}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={[styles.input, { color: colors.text, borderColor: focused ? colors.primary : colors.border, backgroundColor: disabled ? colors.surfaceMuted : colors.surface }, multiline && { minHeight: 110, textAlignVertical: 'top' }]} /></View>;
}
export function Choices({ values, value, onChange, disabled }: { values: readonly string[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const t = useEmployerText(); const colors = useTheme();
  return <View style={styles.row}>{values.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: value === option, disabled: !!disabled }}
    disabled={disabled} onPress={() => onChange(option)} style={[styles.button, { borderColor: colors.border, backgroundColor: value === option ? colors.primarySoft : colors.surface }]}>
    <Text style={{ color: value === option ? colors.primary : colors.text }}>{t(option)}</Text>
  </Pressable>)}</View>;
}
export function DeleteDialog({ visible, busy, error, cancel, confirm, title, body, confirmLabel, errorText }: { visible: boolean; busy: boolean; error: string; cancel: () => void; confirm: () => void; title?: string; body?: string; confirmLabel?: string; errorText?: string }) {
  const t = useEmployerText();
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={() => { if (!busy) cancel(); }}>
    <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal><Card><Copy strong>{title ?? t('deleteTitle')}</Copy><Copy>{body ?? t('deleteBody')}</Copy>
      <Notice text={errorText ?? (error ? t(error) : '')} error /><Button label={busy ? t('saving') : confirmLabel ?? t('delete')} onPress={confirm} danger disabled={busy} />
      <Button label={t('cancel')} onPress={cancel} disabled={busy} /></Card></View></View>
  </Modal>;
}
export const styles = StyleSheet.create({
  card: { padding: 20, borderWidth: 1, borderRadius: 18, gap: 14 },
  button: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, field: { gap: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 14, padding: 14 },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 480 },
});
