import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';

import { EmptySection, Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { loadAdminUsers, setAdminUserSuspended, type AdminUserRecord } from '../admin-service';

type UserFilter = 'all' | 'student' | 'employer' | 'pending' | 'suspended';

export function AdminUsersScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<UserFilter>('all');
  const [search, setSearch] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadAdminUsers()
      .then((result) => {
        if (active) { setUsers(result); setError(false); }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []));

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (filter === 'student' && user.role !== 'student') return false;
      if (filter === 'employer' && user.role !== 'employer') return false;
      if (filter === 'pending' && user.verification_status !== 'pending_email') return false;
      if (filter === 'suspended' && user.verification_status !== 'suspended') return false;
      return !query || user.display_name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [filter, search, users]);

  const toggleSuspension = async (user: AdminUserRecord) => {
    setBusyUserId(user.id);
    setActionError(false);
    try {
      await setAdminUserSuspended(user.id, user.verification_status !== 'suspended');
      setUsers(await loadAdminUsers());
    } catch {
      setActionError(true);
    } finally {
      setBusyUserId(null);
    }
  };

  const filters: { id: UserFilter; label: string }[] = [
    { id: 'all', label: t('admin.filterAll') },
    { id: 'student', label: t('admin.filterStudents') },
    { id: 'employer', label: t('admin.filterEmployers') },
    { id: 'pending', label: t('admin.filterPending') },
    { id: 'suspended', label: t('admin.filterSuspended') },
  ];

  return (
    <Screen title={t('admin.users')} subtitle={t('admin.usersSubtitle')}>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={t('admin.searchUsersPlaceholder')}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('admin.searchUsersPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => {
          const selected = filter === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => setFilter(item.id)}
              style={[styles.filter, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={{ color: selected ? '#FFFFFF' : colors.text, fontWeight: '700' }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <EmptySection title={t('admin.dataLoadErrorTitle')} body={t('admin.dataLoadError')} />
      ) : loading ? (
        <EmptySection title={t('common.loading')} />
      ) : filteredUsers.length === 0 ? (
        <EmptySection title={t('admin.noUsersFound')} />
      ) : (
        filteredUsers.map((user) => {
          const statusLabel = user.verification_status === 'pending_email'
            ? t('admin.filterPending')
            : user.verification_status === 'suspended'
              ? t('admin.suspendedStatus')
              : t('admin.activeStatus');
          const roleLabel = user.role === 'student' ? t('role.student') : user.role === 'employer' ? t('role.employer') : t('role.admin');
          return (
            <View key={user.id} style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.userHeading}>
                <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={user.role === 'employer' ? 'business-outline' : 'person-outline'} size={20} color={colors.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.name, { color: colors.text }]}>{user.display_name}</Text>
                  <Text style={[styles.email, { color: colors.textMuted }]}>{user.email}</Text>
                </View>
              </View>
              <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{roleLabel}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{statusLabel}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>{new Date(user.created_at).toLocaleDateString()}</Text>
              </View>
              {user.role !== 'admin' ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={busyUserId === user.id}
                  onPress={() => void toggleSuspension(user)}
                  style={({ pressed }) => [styles.manageButton, { borderColor: user.verification_status === 'suspended' ? colors.primary : colors.danger, opacity: pressed || busyUserId === user.id ? 0.65 : 1 }]}
                >
                  {busyUserId === user.id ? <ActivityIndicator color={colors.primary} /> : null}
                  <Text style={[styles.manageButtonText, { color: user.verification_status === 'suspended' ? colors.primary : colors.danger }]}>
                    {t(user.verification_status === 'suspended' ? 'admin.unsuspendAccount' : 'admin.suspendAccount')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
      {actionError ? <Text style={[styles.actionError, { color: colors.danger }]}>{t('admin.actionError')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filters: { gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderRadius: 20 },
  userCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  userHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: '700' },
  email: { fontSize: 12 },
  metaRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  meta: { fontSize: 12 },
  manageButton: { minHeight: 42, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  manageButtonText: { fontSize: 13, fontWeight: '700' },
  actionError: { fontSize: 13 },
});
