import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { MOCK_AUDIT_LOGS } from '../constants/mock-data';
import type { AuditLogActionType } from '../types/moderation';

export function AdminProfileScreen() {
  const colors = useTheme();
  const { t, language, setLanguage } = useTranslation();

  const handleToggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  const getLogIcon = (type: AuditLogActionType) => {
    switch (type) {
      case 'verify':
        return { name: 'school-outline' as const, color: colors.primary, bg: colors.primarySoft };
      case 'job':
        return { name: 'briefcase-outline' as const, color: '#EF4444', bg: '#FEE2E2' };
      case 'report':
        return { name: 'flag-outline' as const, color: '#F59E0B', bg: '#FEF3C7' };
      case 'user':
        return { name: 'person-outline' as const, color: '#8B5CF6', bg: '#EDE9FE' };
      default:
        return { name: 'shield-checkmark-outline' as const, color: '#10B981', bg: '#D1FAE5' };
    }
  };

  return (
    <Screen title={t('admin.profile')} subtitle={t('admin.profileSubtitle')}>
      {/* Admin Identity Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="shield" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameBadgeRow}>
              <Text style={[styles.adminName, { color: colors.text }]}>Admin KU Central</Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                  {t('admin.adminRoleBadge')}
                </Text>
              </View>
            </View>
            <Text style={[styles.adminEmail, { color: colors.textMuted }]}>admin@jobmor.ku.th</Text>
            <Text style={[styles.affiliationText, { color: colors.textMuted }]}>
              {t('admin.adminAffiliation')}
            </Text>
          </View>
        </View>
      </View>

      {/* System Security & RLS Health */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.systemSecurity')}</Text>
      <View style={[styles.securityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.securityRow}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.securityLabel, { color: colors.text }]}>{t('admin.rlsStatus')}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statusPillText, { color: '#059669' }]}>Active</Text>
          </View>
        </View>

        <View style={styles.securityRow}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.securityLabel, { color: colors.text }]}>{t('admin.dbStatus')}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statusPillText, { color: '#059669' }]}>Connected</Text>
          </View>
        </View>

        <View style={[styles.securityRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
          <View style={styles.statusIndicator}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.securityLabel, { color: colors.textMuted }]}>Engine Version</Text>
          </View>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>Expo v57 • JobMor v0.1.0</Text>
        </View>
      </View>

      {/* Recent Moderator Audit Logs */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.auditLogTitle')}</Text>
      <View style={[styles.auditLogsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {MOCK_AUDIT_LOGS.map((log, index) => {
          const iconConfig = getLogIcon(log.type);
          const isLast = index === MOCK_AUDIT_LOGS.length - 1;

          return (
            <View
              key={log.id}
              style={[
                styles.auditLogRow,
                { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth },
              ]}
            >
              <View style={[styles.logIconBox, { backgroundColor: iconConfig.bg }]}>
                <Ionicons name={iconConfig.name} size={16} color={iconConfig.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.logActionText, { color: colors.text }]}>{log.action}</Text>
                <Text style={[styles.logTargetText, { color: colors.textMuted }]}>{log.target}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.logTimeText, { color: colors.textMuted }]}>{log.timestamp}</Text>
                <Text style={[styles.logAdminText, { color: colors.primary }]}>{log.adminName}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* App Language Setting */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.languageSetting')}</Text>
      <Pressable
        onPress={handleToggleLanguage}
        style={({ pressed }) => [
          styles.settingBtn,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="globe-outline" size={20} color={colors.primary} />
          <Text style={[styles.settingBtnText, { color: colors.text }]}>
            {language === 'th' ? 'ภาษาไทย (TH)' : 'English (EN)'}
          </Text>
        </View>
        <View style={[styles.langBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.langBadgeText, { color: colors.primary }]}>
            Switch to {language === 'th' ? 'EN' : 'TH'}
          </Text>
        </View>
      </Pressable>

    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '800',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  adminEmail: {
    fontSize: 13,
    marginTop: 3,
  },
  affiliationText: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
  },
  securityCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 6,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  securityLabel: {
    fontSize: 13,
    fontWeight: '600',
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
  versionText: {
    fontSize: 12,
  },
  auditLogsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
  },
  auditLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  logIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logTargetText: {
    fontSize: 11,
    marginTop: 2,
  },
  logTimeText: {
    fontSize: 10,
  },
  logAdminText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  settingBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  settingBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  langBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
