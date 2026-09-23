import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';

import { Screen } from '@/components/screen';
import { logoutAccount } from '@/features/auth/auth-service';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import { useAuth } from '@/providers/auth-provider';

export function AdminProfileScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const metadataName = session?.user.user_metadata.display_name;
  const displayName = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName
    : session?.user.email ?? '';

  const logout = async () => {
    setSubmitting(true);
    setLogoutError(false);
    try {
      await logoutAccount();
      router.replace('/');
    } catch {
      setLogoutError(true);
      setSubmitting(false);
    }
  };

  return (
    <Screen title={t('admin.profile')} subtitle={t('admin.profileSubtitle')}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
        </View>
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{session?.user.email}</Text>
          <Text style={[styles.role, { color: colors.primary }]}>{t('role.admin')}</Text>
        </View>
      </View>
      {logoutError ? <Text style={[styles.error, { color: colors.danger }]}>{t('auth.logoutFailed')}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={() => void logout()}
        style={({ pressed }) => [styles.logoutButton, { borderColor: colors.danger, opacity: pressed || submitting ? 0.65 : 1 }]}
      >
        {submitting ? <ActivityIndicator color={colors.danger} /> : <Ionicons name="log-out-outline" size={20} color={colors.danger} />}
        <Text style={[styles.logoutText, { color: colors.danger }]}>{t(submitting ? 'auth.loggingOut' : 'auth.logout')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 18, padding: 18 },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '800' },
  email: { fontSize: 13 },
  role: { fontSize: 12, fontWeight: '700' },
  error: { fontSize: 13 },
  logoutButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontSize: 14, fontWeight: '800' },
});
