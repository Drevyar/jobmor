import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { MOCK_MANAGED_USERS } from '../constants/mock-data';
import type { ManagedUserItem } from '../types/moderation';

type FilterTab = 'all' | 'pending' | 'students' | 'employers' | 'suspended';

export function AdminUsersScreen() {
  const colors = useTheme();
  const { t } = useTranslation();

  const [users, setUsers] = useState<ManagedUserItem[]>(MOCK_MANAGED_USERS);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const pendingCount = useMemo(
    () => users.filter((u) => u.verificationStatus === 'pending' || u.accountStatus === 'pending').length,
    [users]
  );
  const suspendedCount = useMemo(() => users.filter((u) => u.accountStatus === 'suspended').length, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Tab matching
      if (activeTab === 'pending' && user.verificationStatus !== 'pending' && user.accountStatus !== 'pending') {
        return false;
      }
      if (activeTab === 'students' && user.role !== 'student') {
        return false;
      }
      if (activeTab === 'employers' && user.role !== 'employer') {
        return false;
      }
      if (activeTab === 'suspended' && user.accountStatus !== 'suspended') {
        return false;
      }

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = user.displayName.toLowerCase().includes(q);
        const emailMatch = user.email.toLowerCase().includes(q);
        const studentIdMatch = user.studentId ? user.studentId.toLowerCase().includes(q) : false;
        const companyMatch = user.companyName ? user.companyName.toLowerCase().includes(q) : false;
        return nameMatch || emailMatch || studentIdMatch || companyMatch;
      }

      return true;
    });
  }, [users, activeTab, searchQuery]);

  // Actions
  const handleApprove = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
            ...u,
            verificationStatus: 'verified',
            accountStatus: 'active',
          }
          : u
      )
    );
  };

  const handleReject = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
            ...u,
            verificationStatus: 'rejected',
            accountStatus: 'suspended',
          }
          : u
      )
    );
  };

  const handleToggleSuspend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const isSuspended = u.accountStatus === 'suspended';
          return {
            ...u,
            accountStatus: isSuspended ? 'active' : 'suspended',
          };
        }
        return u;
      })
    );
  };

  const tabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: 'all', label: t('admin.filterAll'), badge: users.length },
    { key: 'pending', label: t('admin.filterPending'), badge: pendingCount },
    { key: 'students', label: t('admin.filterStudents') },
    { key: 'employers', label: t('admin.filterEmployers') },
    { key: 'suspended', label: t('admin.filterSuspended'), badge: suspendedCount },
  ];

  return (
    <Screen title={t('admin.users')} subtitle={t('admin.usersSubtitle')}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('admin.searchUsersPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabChipText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {tab.label}
              </Text>
              {typeof tab.badge === 'number' && tab.badge > 0 ? (
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor: isSelected ? '#FFFFFF' : colors.primarySoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      { color: isSelected ? colors.primary : colors.primary },
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* User Cards List */}
      {filteredUsers.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={36} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('admin.noUsersFound')}</Text>
        </View>
      ) : (
        filteredUsers.map((user) => {
          const isStudent = user.role === 'student';
          const isPending = user.verificationStatus === 'pending' || user.accountStatus === 'pending';
          const isSuspended = user.accountStatus === 'suspended';

          return (
            <View
              key={user.id}
              style={[
                styles.userCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isPending ? '#F59E0B' : isSuspended ? '#EF4444' : colors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.userMain}>
                  <View
                    style={[
                      styles.roleIconBox,
                      {
                        backgroundColor: isStudent ? colors.primarySoft : '#FEF3C7',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isStudent ? 'school-outline' : 'business-outline'}
                      size={20}
                      color={isStudent ? colors.primary : '#D97706'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.userName, { color: colors.text }]}>{user.displayName}</Text>
                      {user.verificationStatus === 'verified' && (
                        <View style={styles.verifiedTag}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={styles.verifiedText}>{t('admin.verifiedBadge')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email}</Text>
                  </View>
                </View>

                {/* Account Status Badge */}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isSuspended ? '#FEE2E2' : isPending ? '#FEF3C7' : '#D1FAE5',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: isSuspended ? '#DC2626' : isPending ? '#D97706' : '#059669',
                      },
                    ]}
                  >
                    {isSuspended
                      ? t('admin.suspendedStatus')
                      : isPending
                        ? t('admin.pendingStatus')
                        : t('admin.activeStatus')}
                  </Text>
                </View>
              </View>

              {/* Extra Details */}
              <View style={styles.detailsBox}>
                {isStudent && (
                  <>
                    {user.studentId ? (
                      <Text style={[styles.detailText, { color: colors.textMuted }]}>
                        KU ID: <Text style={{ color: colors.text, fontWeight: '600' }}>{user.studentId}</Text>
                      </Text>
                    ) : null}
                    {user.faculty ? (
                      <Text style={[styles.detailText, { color: colors.textMuted }]}>
                        คณะ: <Text style={{ color: colors.text, fontWeight: '600' }}>{user.faculty}</Text>
                      </Text>
                    ) : null}
                  </>
                )}

                {!isStudent && (
                  <>
                    {user.companyName ? (
                      <Text style={[styles.detailText, { color: colors.textMuted }]}>
                        กิจการ: <Text style={{ color: colors.text, fontWeight: '600' }}>{user.companyName}</Text>
                      </Text>
                    ) : null}
                    {user.category ? (
                      <Text style={[styles.detailText, { color: colors.textMuted }]}>
                        หมวดหมู่: <Text style={{ color: colors.text, fontWeight: '600' }}>{user.category}</Text>
                      </Text>
                    ) : null}
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                {isPending && (
                  <View style={styles.pendingActionGroup}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.approveBtn,
                        { backgroundColor: '#10B981', opacity: pressed ? 0.8 : 1 },
                      ]}
                      onPress={() => handleApprove(user.id)}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.btnTextWhite}>{t('admin.approveVerification')}</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.rejectBtn,
                        { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                      ]}
                      onPress={() => handleReject(user.id)}
                    >
                      <Ionicons name="close" size={16} color="#EF4444" />
                      <Text style={[styles.btnTextDanger]}>{t('admin.rejectVerification')}</Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.suspendBtn,
                    {
                      borderColor: isSuspended ? '#10B981' : '#EF4444',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => handleToggleSuspend(user.id)}
                >
                  <Ionicons
                    name={isSuspended ? 'lock-open-outline' : 'ban-outline'}
                    size={14}
                    color={isSuspended ? '#10B981' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.suspendBtnText,
                      { color: isSuspended ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {isSuspended ? t('admin.unsuspendAccount') : t('admin.suspendAccount')}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  tabsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  userCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userMain: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pendingActionGroup: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnTextDanger: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  suspendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  suspendBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
  },
});
