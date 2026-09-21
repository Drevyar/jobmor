import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import type { IconName } from '@/constants/roles';

import { MOCK_VERIFICATIONS, MOCK_REPORTS } from '../constants/mock-data';
import type { VerificationQueueItem, ReportQueueItem } from '../types/moderation';

export function AdminDashboardScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [verifications, setVerifications] = useState<VerificationQueueItem[]>(MOCK_VERIFICATIONS);
  const [reports, setReports] = useState<ReportQueueItem[]>(MOCK_REPORTS);

  // Platform Metrics
  const metrics: {
    label: string;
    value: string | number;
    icon: IconName;
    highlight?: boolean;
  }[] = [
    { label: t('admin.students'), value: '1,248', icon: 'school-outline' },
    { label: t('admin.employers'), value: '86', icon: 'business-outline' },
    { label: t('admin.activeJobs'), value: '42', icon: 'briefcase-outline' },
    {
      label: t('admin.verifications'),
      value: verifications.filter((v) => v.status === 'pending').length,
      icon: 'document-text-outline',
      highlight: verifications.filter((v) => v.status === 'pending').length > 0,
    },
    {
      label: t('admin.reports'),
      value: reports.filter((r) => r.status === 'pending').length,
      icon: 'flag-outline',
      highlight: reports.filter((r) => r.status === 'pending').length > 0,
    },
    { label: t('admin.health'), value: t('admin.systemHealthy'), icon: 'pulse-outline' },
  ];

  // Quick Action Handler
  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const handleReviewVerification = (id: string) => {
    setVerifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'verified' as const } : item))
    );
  };

  const handleResolveReport = (id: string) => {
    setReports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'resolved' as const } : item))
    );
  };

  return (
    <Screen title={t('admin.dashboard')} subtitle={t('admin.dashboardSubtitle')}>
      {/* System Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.statusBannerText, { color: colors.text }]}>
            {t('admin.systemStatus')}: <Text style={{ fontWeight: '700', color: '#10B981' }}>{t('admin.systemHealthy')}</Text>
          </Text>
        </View>
        <Text style={[styles.statusSubtext, { color: colors.textMuted }]}>
          Expo v57 • JobMor Moderation Engine
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.grid}>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            style={[
              styles.metricCard,
              {
                backgroundColor: colors.surface,
                borderColor: metric.highlight ? colors.primary : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor: metric.highlight ? colors.primarySoft : colors.surface,
                },
              ]}
            >
              <Ionicons
                name={metric.icon}
                size={22}
                color={metric.highlight ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={styles.metricTextGroup}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]} numberOfLines={1}>
                {metric.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.quickActions')}</Text>
      <View style={styles.quickActionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => handleQuickAction('/(admin)/users')}
        >
          <Ionicons name="people-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('admin.reviewVerifications')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => handleQuickAction('/(admin)/reports')}
        >
          <Ionicons name="warning-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('admin.viewReports')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => handleQuickAction('/(admin)/jobs')}
        >
          <Ionicons name="briefcase-outline" size={18} color="#F59E0B" />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('admin.moderateJobs')}</Text>
        </Pressable>
      </View>

      {/* Pending Student Verifications Queue */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('admin.pendingVerificationsTitle')}
        </Text>
        <Text style={[styles.badgeCount, { backgroundColor: colors.primarySoft, color: colors.primary }]}>
          {verifications.filter((v) => v.status === 'pending').length}
        </Text>
      </View>

      {verifications.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('common.emptyTitle')}</Text>
        </View>
      ) : (
        verifications.map((item) => (
          <View
            key={item.id}
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemMainInfo}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="person-outline" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.studentName}</Text>
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                    ID: {item.studentId} • {item.faculty}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 'verified' ? '#D1FAE5' : '#FEF3C7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: item.status === 'verified' ? '#059669' : '#D97706',
                    },
                  ]}
                >
                  {item.status === 'verified' ? t('admin.approvedStatus') : t('admin.pendingStatus')}
                </Text>
              </View>
            </View>

            {item.status === 'pending' && (
              <View style={styles.itemFooter}>
                <Text style={[styles.emailText, { color: colors.textMuted }]}>{item.universityEmail}</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => handleReviewVerification(item.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>{t('admin.reviewAction')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}

      {/* Recent Reports & Flags Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('admin.recentReportsTitle')}
        </Text>
        <Text style={[styles.badgeCount, { backgroundColor: '#FEE2E2', color: '#DC2626' }]}>
          {reports.filter((r) => r.status === 'pending').length}
        </Text>
      </View>

      {reports.map((report) => (
        <View
          key={report.id}
          style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.itemHeader}>
            <View style={styles.itemMainInfo}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons
                  name={report.targetType === 'user' ? 'person-circle-outline' : 'briefcase-outline'}
                  size={20}
                  color="#DC2626"
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{report.targetName}</Text>
                  <Text style={[styles.tagType, { color: colors.textMuted }]}>
                    ({report.targetType === 'user' ? t('admin.targetUser') : t('admin.targetJob')})
                  </Text>
                </View>
                <Text style={[styles.reasonText, { color: colors.text }]} numberOfLines={2}>
                  {`"${report.reason}"`}
                </Text>
                <Text style={[styles.itemSub, { color: colors.textMuted, marginTop: 4 }]}>
                  Reported by: {report.reporterName}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.itemFooter}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: report.status === 'resolved' ? '#D1FAE5' : '#FEE2E2',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: report.status === 'resolved' ? '#059669' : '#DC2626' },
                ]}
              >
                {report.status === 'resolved' ? t('admin.approvedStatus') : t('admin.pendingStatus')}
              </Text>
            </View>

            {report.status === 'pending' && (
              <Pressable
                style={({ pressed }) => [
                  styles.dangerBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => handleResolveReport(report.id)}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>{t('admin.resolveAction')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusBannerText: {
    fontSize: 13,
  },
  statusSubtext: {
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexGrow: 1,
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextGroup: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  itemCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemMainInfo: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagType: {
    fontSize: 12,
  },
  reasonText: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailText: {
    fontSize: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
