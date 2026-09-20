import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { logoutAccount } from '@/features/auth/auth-service';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export function AuthenticatedProfileScreen({ titleKey }: { titleKey: string }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const logout = async () => {
    setSubmitting(true);
    setError('');
    try {
      await logoutAccount();
      router.replace('/');
    } catch {
      setError(t('auth.logoutFailed'));
      setSubmitting(false);
    }
  };

  return (
    <Screen title={t(titleKey)}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="person-outline" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.body, { color: colors.textMuted }]}>{t('auth.profileSession')}</Text>
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        <Pressable disabled={submitting} onPress={logout} style={[styles.logoutButton, { borderColor: colors.danger }, submitting && styles.disabled]}>
          {submitting ? <ActivityIndicator color={colors.danger} /> : <Ionicons name="log-out-outline" size={20} color={colors.danger} />}
          <Text style={[styles.logoutText, { color: colors.danger }]}>{t(submitting ? 'auth.loggingOut' : 'auth.logout')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 220, padding: 24, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: 12, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  error: { marginTop: 10, fontSize: 12, textAlign: 'center' },
  logoutButton: { width: '100%', minHeight: 50, marginTop: 20, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.65 },
});
