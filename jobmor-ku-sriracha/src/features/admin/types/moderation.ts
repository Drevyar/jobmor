import type { IconName } from '@/constants/roles';
import type { UserRole } from '@/types/user';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type TargetType = 'user' | 'job';
export type UserAccountStatus = 'active' | 'suspended' | 'pending';

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
