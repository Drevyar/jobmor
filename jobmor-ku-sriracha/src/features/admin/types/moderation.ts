import type { IconName } from '@/constants/roles';
import type { UserRole } from '@/types/user';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type TargetType = 'user' | 'job';
export type UserAccountStatus = 'active' | 'suspended' | 'pending';
export type ReportSeverity = 'low' | 'medium' | 'high';
export type ReportCategory = 'fraud' | 'no_show' | 'inappropriate' | 'wage_dispute' | 'other';
export type JobModerationStatus = 'active' | 'flagged' | 'taken_down' | 'closed';
export type AuditLogActionType = 'verify' | 'report' | 'job' | 'user' | 'system';

export interface ModerationMetric {
  id: string;
  labelKey: string;
  value: number | string;
  icon: IconName;
  badgeText?: string;
  badgeType?: 'warning' | 'success' | 'info' | 'error';
  change?: string;
}

export interface VerificationQueueItem {
  id: string;
  studentName: string;
  studentId: string;
  faculty: string;
  universityEmail: string;
  submittedAt: string;
  status: VerificationStatus;
  avatarUrl?: string;
}

export interface ReportQueueItem {
  id: string;
  reporterName: string;
  targetType: TargetType;
  targetName: string;
  reason: string;
  createdAt: string;
  status: ReportStatus;
}

export interface DetailedReportItem {
  id: string;
  reporterName: string;
  reporterRole?: 'student' | 'employer' | 'anonymous';
  targetType: TargetType;
  targetName: string;
  targetDetails?: string;
  category: ReportCategory;
  reason: string;
  severity: ReportSeverity;
  createdAt: string;
  status: ReportStatus;
  actionTaken?: string;
}

export interface ManagedUserItem {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  accountStatus: UserAccountStatus;
  verificationStatus?: VerificationStatus;
  studentId?: string;
  faculty?: string;
  universityEmail?: string;
  companyName?: string;
  category?: string;
  joinedAt: string;
}

export interface ModeratedJobItem {
  id: string;
  title: string;
  companyName: string;
  employerId: string;
  wage: string;
  location: string;
  category: string;
  jobType: string;
  description: string;
  postedAt: string;
  moderationStatus: JobModerationStatus;
  flagCount?: number;
  flagReason?: string;
  takedownReason?: string;
}

export interface AdminAuditLogItem {
  id: string;
  action: string;
  target: string;
  adminName: string;
  timestamp: string;
  type: AuditLogActionType;
}
