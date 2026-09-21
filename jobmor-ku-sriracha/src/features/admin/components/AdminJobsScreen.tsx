import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { MOCK_MODERATED_JOBS } from '../constants/mock-data';
import type { ModeratedJobItem } from '../types/moderation';

type JobFilterTab = 'all' | 'flagged' | 'active' | 'taken_down';

export function AdminJobsScreen() {
  const colors = useTheme();
  const { t } = useTranslation();

  const [jobs, setJobs] = useState<ModeratedJobItem[]>(MOCK_MODERATED_JOBS);
  const [activeTab, setActiveTab] = useState<JobFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const flaggedCount = useMemo(() => jobs.filter((j) => j.moderationStatus === 'flagged').length, [jobs]);
  const activeCount = useMemo(() => jobs.filter((j) => j.moderationStatus === 'active').length, [jobs]);
  const takenDownCount = useMemo(() => jobs.filter((j) => j.moderationStatus === 'taken_down').length, [jobs]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Tab matching
      if (activeTab === 'flagged' && job.moderationStatus !== 'flagged') {
        return false;
      }
      if (activeTab === 'active' && job.moderationStatus !== 'active') {
        return false;
      }
      if (activeTab === 'taken_down' && job.moderationStatus !== 'taken_down') {
        return false;
      }

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = job.title.toLowerCase().includes(q);
        const companyMatch = job.companyName.toLowerCase().includes(q);
        const locationMatch = job.location.toLowerCase().includes(q);
        const categoryMatch = job.category.toLowerCase().includes(q);
        return titleMatch || companyMatch || locationMatch || categoryMatch;
      }

      return true;
    });
  }, [jobs, activeTab, searchQuery]);

  // Actions
  const handleClearFlag = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              moderationStatus: 'active' as const,
              flagCount: 0,
              flagReason: undefined,
            }
          : j
      )
    );
  };

  const handleTakeDown = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              moderationStatus: 'taken_down' as const,
              takedownReason: 'ระงับประกาศงานโดยผู้ดูแลระบบเนื่องจากมีข้อร้องเรียน',
            }
          : j
      )
    );
  };

  const handleRestore = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              moderationStatus: 'active' as const,
              takedownReason: undefined,
            }
          : j
      )
    );
  };

  const tabs: { key: JobFilterTab; label: string; badge?: number }[] = [
    { key: 'all', label: t('admin.jobsFilterAll'), badge: jobs.length },
    { key: 'flagged', label: t('admin.jobsFilterFlagged'), badge: flaggedCount },
    { key: 'active', label: t('admin.jobsFilterActive'), badge: activeCount },
    { key: 'taken_down', label: t('admin.jobsFilterTakenDown'), badge: takenDownCount },
  ];

  return (
    <Screen title={t('admin.jobs')} subtitle={t('admin.jobsSubtitle')}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('admin.searchJobsPlaceholder')}
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
              <Text style={[styles.tabChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
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
                  <Text style={[styles.tabBadgeText, { color: colors.primary }]}>{tab.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="briefcase-outline" size={38} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('admin.noJobsFound')}</Text>
        </View>
      ) : (
        filteredJobs.map((job) => {
          const isFlagged = job.moderationStatus === 'flagged';
          const isTakenDown = job.moderationStatus === 'taken_down';

          return (
            <View
              key={job.id}
              style={[
                styles.jobCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isFlagged ? '#F59E0B' : isTakenDown ? '#EF4444' : colors.border,
                },
              ]}
            >
              {/* Header: Title & Status */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                  <Text style={[styles.companyName, { color: colors.primary }]}>{job.companyName}</Text>
                </View>

                {/* Status Pill */}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isFlagged ? '#FEF3C7' : isTakenDown ? '#FEE2E2' : '#D1FAE5',
                    },
                  ]}
                >
                  {isFlagged && <Ionicons name="warning-outline" size={12} color="#D97706" />}
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: isFlagged ? '#D97706' : isTakenDown ? '#DC2626' : '#059669',
                      },
                    ]}
                  >
                    {isFlagged
                      ? `${t('admin.flaggedBadge')} (${job.flagCount || 1})`
                      : isTakenDown
                      ? t('admin.takenDownBadge')
                      : t('admin.activeStatus')}
                  </Text>
                </View>
              </View>

              {/* Tags Row */}
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="cash-outline" size={13} color={colors.primary} />
                  <Text style={[styles.tagText, { color: colors.primary, fontWeight: '700' }]}>
                    {job.wage}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.tagText, { color: colors.textMuted }]}>{job.location}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.tagText, { color: colors.textMuted }]}>{job.jobType}</Text>
                </View>
              </View>

              {/* Description preview */}
              <Text style={[styles.descriptionText, { color: colors.textMuted }]} numberOfLines={2}>
                {job.description}
              </Text>

              {/* Flagged Alert Box if flagged */}
              {isFlagged && job.flagReason && (
                <View style={styles.flaggedBox}>
                  <Ionicons name="alert-circle" size={16} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.flaggedTitle}>
                      มีรายงานข้อร้องเรียน ({job.flagCount} {t('admin.flagCountLabel')}):
                    </Text>
                    <Text style={styles.flaggedReason}>{`"${job.flagReason}"`}</Text>
                  </View>
                </View>
              )}

              {/* Takedown Note if taken down */}
              {isTakenDown && job.takedownReason && (
                <View style={styles.takedownBox}>
                  <Ionicons name="ban" size={16} color="#DC2626" />
                  <Text style={styles.takedownReason}>{job.takedownReason}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionRow}>
                {isFlagged && (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.approveBtn,
                        { backgroundColor: '#10B981', opacity: pressed ? 0.8 : 1 },
                      ]}
                      onPress={() => handleClearFlag(job.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.btnTextWhite}>{t('admin.approveJob')}</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.dangerBtn,
                        { backgroundColor: '#EF4444', opacity: pressed ? 0.8 : 1 },
                      ]}
                      onPress={() => handleTakeDown(job.id)}
                    >
                      <Ionicons name="ban-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.btnTextWhite}>{t('admin.takeDownJob')}</Text>
                    </Pressable>
                  </>
                )}

                {!isFlagged && !isTakenDown && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.outlineDangerBtn,
                      { borderColor: '#EF4444', opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handleTakeDown(job.id)}
                  >
                    <Ionicons name="ban-outline" size={14} color="#EF4444" />
                    <Text style={[styles.btnTextDanger]}>{t('admin.takeDownJob')}</Text>
                  </Pressable>
                )}

                {isTakenDown && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.restoreBtn,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handleRestore(job.id)}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.btnTextWhite}>{t('admin.restoreJob')}</Text>
                  </Pressable>
                )}
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
  jobCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
  },
  descriptionText: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  flaggedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  flaggedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  flaggedReason: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
    fontStyle: 'italic',
  },
  takedownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  takedownReason: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  outlineDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
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
