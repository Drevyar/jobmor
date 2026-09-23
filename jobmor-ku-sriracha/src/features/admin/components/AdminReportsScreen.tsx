import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { MOCK_DETAILED_REPORTS } from '../constants/mock-data';
import type { DetailedReportItem, ReportCategory, ReportSeverity } from '../types/moderation';

type ReportFilterTab = 'all' | 'pending' | 'user' | 'job' | 'resolved';

export function AdminReportsScreen() {
  const colors = useTheme();
  const { t } = useTranslation();

  const [reports, setReports] = useState<DetailedReportItem[]>(MOCK_DETAILED_REPORTS);
  const [activeTab, setActiveTab] = useState<ReportFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const pendingCount = useMemo(() => reports.filter((r) => r.status === 'pending').length, [reports]);
  const urgentCount = useMemo(
    () => reports.filter((r) => r.status === 'pending' && r.severity === 'high').length,
    [reports]
  );

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Tab filter
      if (activeTab === 'pending' && report.status !== 'pending') {
        return false;
      }
      if (activeTab === 'user' && report.targetType !== 'user') {
        return false;
      }
      if (activeTab === 'job' && report.targetType !== 'job') {
        return false;
      }
      if (activeTab === 'resolved' && report.status !== 'resolved' && report.status !== 'dismissed') {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const targetMatch = report.targetName.toLowerCase().includes(q);
        const reporterMatch = report.reporterName.toLowerCase().includes(q);
        const reasonMatch = report.reason.toLowerCase().includes(q);
        const detailsMatch = report.targetDetails ? report.targetDetails.toLowerCase().includes(q) : false;
        return targetMatch || reporterMatch || reasonMatch || detailsMatch;
      }

      return true;
    });
  }, [reports, activeTab, searchQuery]);

  // Actions
  const handleResolve = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'resolved' as const,
              actionTaken: 'ดำเนินการตรวจสอบและจัดการเรียบร้อยแล้ว',
            }
          : r
      )
    );
  };

  const handleDismiss = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'dismissed' as const,
              actionTaken: 'คำร้องถูกยกเลิกเนื่องจากไม่พบความผิดปกติ',
            }
          : r
      )
    );
  };

  const getCategoryLabel = (category: ReportCategory): string => {
    switch (category) {
      case 'fraud':
        return t('admin.categoryFraud');
      case 'no_show':
        return t('admin.categoryNoShow');
      case 'inappropriate':
        return t('admin.categoryInappropriate');
      case 'wage_dispute':
        return t('admin.categoryWageDispute');
      default:
        return t('admin.categoryOther');
    }
  };

  const getSeverityStyle = (severity: ReportSeverity) => {
    switch (severity) {
      case 'high':
        return { bg: '#FEE2E2', text: '#DC2626', label: t('admin.severityHigh') };
      case 'medium':
        return { bg: '#FEF3C7', text: '#D97706', label: t('admin.severityMedium') };
      default:
        return { bg: '#E5E7EB', text: '#4B5563', label: t('admin.severityLow') };
    }
  };

  const tabs: { key: ReportFilterTab; label: string; badge?: number }[] = [
    { key: 'all', label: t('admin.reportsFilterAll'), badge: reports.length },
    { key: 'pending', label: t('admin.reportsFilterPending'), badge: pendingCount },
    { key: 'user', label: t('admin.reportsFilterUser') },
    { key: 'job', label: t('admin.reportsFilterJob') },
    { key: 'resolved', label: t('admin.reportsFilterResolved') },
  ];

  return (
    <Screen title={t('admin.reports')} subtitle={t('admin.reportsSubtitle')}>
      {/* Urgent Banner if any urgent items */}
      {urgentCount > 0 && (
        <View style={[styles.urgentBanner, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
          <Ionicons name="alert-circle" size={20} color="#DC2626" />
          <Text style={styles.urgentBannerText}>
            มีเคสเร่งด่วน ({urgentCount} รายการ) ที่ต้องได้รับการตรวจสอบความปลอดภัย
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('admin.searchReportsPlaceholder')}
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

      {/* Report Cards List */}
      {filteredReports.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={38} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('admin.noReportsFound')}</Text>
        </View>
      ) : (
        filteredReports.map((report) => {
          const isUser = report.targetType === 'user';
          const isPending = report.status === 'pending';
          const severityInfo = getSeverityStyle(report.severity);

          return (
            <View
              key={report.id}
              style={[
                styles.reportCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: report.severity === 'high' && isPending ? '#EF4444' : colors.border,
                },
              ]}
            >
              {/* Header: Target Type & Severity */}
              <View style={styles.cardHeader}>
                <View style={styles.typeBadgeRow}>
                  <View
                    style={[
                      styles.targetTypeBadge,
                      { backgroundColor: isUser ? colors.primarySoft : '#FEF3C7' },
                    ]}
                  >
                    <Ionicons
                      name={isUser ? 'person-circle-outline' : 'briefcase-outline'}
                      size={14}
                      color={isUser ? colors.primary : '#D97706'}
                    />
                    <Text style={[styles.targetTypeText, { color: isUser ? colors.primary : '#D97706' }]}>
                      {isUser ? t('admin.targetUser') : t('admin.targetJob')}
                    </Text>
                  </View>

                  <View style={[styles.categoryBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.categoryText, { color: colors.textMuted }]}>
                      {getCategoryLabel(report.category)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.severityBadge, { backgroundColor: severityInfo.bg }]}>
                  <Text style={[styles.severityText, { color: severityInfo.text }]}>
                    {severityInfo.label}
                  </Text>
                </View>
              </View>

              {/* Subject Title & Details */}
              <View style={styles.targetInfoSection}>
                <Text style={[styles.targetName, { color: colors.text }]}>{report.targetName}</Text>
                {report.targetDetails ? (
                  <Text style={[styles.targetDetails, { color: colors.textMuted }]}>
                    {report.targetDetails}
                  </Text>
                ) : null}
              </View>

              {/* Reason Quote */}
              <View style={[styles.reasonBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.reasonText, { color: colors.text }]}>{`"${report.reason}"`}</Text>
              </View>

              {/* Reporter Attribution */}
              <View style={styles.reporterRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.reporterText, { color: colors.textMuted }]}>
                    ผู้รายงาน: <Text style={{ color: colors.text, fontWeight: '600' }}>{report.reporterName}</Text>
                  </Text>
                </View>

                {/* Status Pill */}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        report.status === 'resolved'
                          ? '#D1FAE5'
                          : report.status === 'dismissed'
                          ? '#E5E7EB'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          report.status === 'resolved'
                            ? '#059669'
                            : report.status === 'dismissed'
                            ? '#4B5563'
                            : '#D97706',
                      },
                    ]}
                  >
                    {report.status === 'resolved'
                      ? t('admin.resolvedBadge')
                      : report.status === 'dismissed'
                      ? t('admin.dismissedBadge')
                      : t('admin.pendingStatus')}
                  </Text>
                </View>
              </View>

              {/* Resolution Note if resolved */}
              {report.actionTaken && (
                <View style={styles.actionTakenBox}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
                  <Text style={[styles.actionTakenText, { color: colors.textMuted }]}>
                    {report.actionTaken}
                  </Text>
                </View>
              )}

              {/* Actions for pending items */}
              {isPending && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.resolveBtn,
                      { backgroundColor: '#10B981', opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handleResolve(report.id)}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.btnTextWhite}>{t('admin.resolveReport')}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.dismissBtn,
                      { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => handleDismiss(report.id)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} />
                    <Text style={[styles.btnTextMuted, { color: colors.textMuted }]}>
                      {t('admin.dismissReport')}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  urgentBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },
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
  reportCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  targetTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  targetTypeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  targetInfoSection: {
    marginTop: 10,
    gap: 2,
  },
  targetName: {
    fontSize: 15,
    fontWeight: '700',
  },
  targetDetails: {
    fontSize: 12,
  },
  reasonBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  reporterRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reporterText: {
    fontSize: 11,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionTakenBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionTakenText: {
    fontSize: 11,
    flex: 1,
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 8,
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnTextMuted: {
    fontSize: 12,
    fontWeight: '600',
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
