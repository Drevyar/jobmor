import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { UserRole } from '@/types/user';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type RoleTab = { key: string; labelKey: string; icon: IconName; iconActive: IconName };
export type RoleConfig = { labelKey: string; descriptionKey: string; entryHref: string; icon: IconName; tabs: RoleTab[] };

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  student: {
    labelKey: 'role.student', descriptionKey: 'role.studentBody', entryHref: '/(student)/home', icon: 'school-outline',
    tabs: [
      { key: 'home', labelKey: 'tabs.home', icon: 'home-outline', iconActive: 'home' },
      { key: 'explore', labelKey: 'tabs.explore', icon: 'search-outline', iconActive: 'search' },
      { key: 'applications', labelKey: 'tabs.applications', icon: 'document-text-outline', iconActive: 'document-text' },
      { key: 'messages', labelKey: 'tabs.messages', icon: 'chatbubble-outline', iconActive: 'chatbubble' },
      { key: 'profile', labelKey: 'tabs.profile', icon: 'person-outline', iconActive: 'person' },
    ],
  },
  employer: {
    labelKey: 'role.employer', descriptionKey: 'role.employerBody', entryHref: '/(employer)/dashboard', icon: 'business-outline',
    tabs: [
      { key: 'dashboard', labelKey: 'tabs.dashboard', icon: 'grid-outline', iconActive: 'grid' },
      { key: 'jobs', labelKey: 'tabs.jobs', icon: 'briefcase-outline', iconActive: 'briefcase' },
      { key: 'applicants', labelKey: 'tabs.applicants', icon: 'people-outline', iconActive: 'people' },
      { key: 'messages', labelKey: 'tabs.messages', icon: 'chatbubble-outline', iconActive: 'chatbubble' },
      { key: 'profile', labelKey: 'tabs.profile', icon: 'person-outline', iconActive: 'person' },
    ],
  },
  admin: {
    labelKey: 'role.admin', descriptionKey: 'role.adminBody', entryHref: '/(admin)/dashboard', icon: 'shield-checkmark-outline',
    tabs: [
      { key: 'dashboard', labelKey: 'tabs.dashboard', icon: 'grid-outline', iconActive: 'grid' },
      { key: 'users', labelKey: 'tabs.users', icon: 'people-outline', iconActive: 'people' },
      { key: 'jobs', labelKey: 'tabs.jobs', icon: 'briefcase-outline', iconActive: 'briefcase' },
      { key: 'reports', labelKey: 'tabs.reports', icon: 'flag-outline', iconActive: 'flag' },
      { key: 'profile', labelKey: 'tabs.profile', icon: 'settings-outline', iconActive: 'settings' },
    ],
  },
};

export const ALL_ROLES: UserRole[] = ['student', 'employer', 'admin'];
