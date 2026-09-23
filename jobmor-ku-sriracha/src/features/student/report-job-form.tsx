import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { submitJobReport } from './student-service';

export function ReportJobForm({ jobId }: { jobId: string }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const close = () => {
    if (submitting) return;
    setVisible(false);
    setReason('');
    setError('');
    setSent(false);
  };

  const submit = async () => {
    if (reason.trim().length < 10) {
      setError(t('report.reasonRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitJobReport(jobId, reason);
      setSent(true);
    } catch {
      setError(t('report.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.openButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
      >
        <Ionicons name="flag-outline" size={18} color={colors.danger} />
        <Text style={[styles.openLabel, { color: colors.danger }]}>{t('report.jobAction')}</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t(sent ? 'report.successTitle' : 'report.title')}</Text>
            {sent ? (
              <>
                <Text style={[styles.hint, { color: colors.textMuted }]}>{t('report.successBody')}</Text>
                <Pressable accessibilityRole="button" onPress={close} style={[styles.submitButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.submitLabel}>{t('report.close')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: colors.text }]}>{t('report.reason')}</Text>
                <TextInput
                  accessibilityLabel={t('report.reason')}
                  multiline
                  maxLength={2000}
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t('report.reasonHint')}
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
                {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" disabled={submitting} onPress={close} style={[styles.cancelButton, { borderColor: colors.border }]}>
                    <Text style={[styles.cancelLabel, { color: colors.textMuted }]}>{t('report.cancel')}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}>
                    {submitting ? <ActivityIndicator color="#FFFFFF" /> : null}
                    <Text style={styles.submitLabel}>{t(submitting ? 'report.submitting' : 'report.submit')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  openButton: { minHeight: 46, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  openLabel: { fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.45)' },
  dialog: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 12 },
  title: { fontSize: 19, fontWeight: '800' },
  label: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 14, lineHeight: 20 },
  input: { minHeight: 130, maxHeight: 240, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  error: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontSize: 14, fontWeight: '700' },
  submitButton: { flex: 1, minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
