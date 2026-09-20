import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';

import { ROLE_CONFIGS } from '@/constants/roles';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import type { UserRole } from '@/types/user';

export function useRoleTabs(role: UserRole) {
  const colors = useTheme();
  const { t } = useTranslation();
  const tabs = ROLE_CONFIGS[role].tabs;
  return {
    screenOptions: {
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarHideOnKeyboard: true,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, paddingBottom: 6 },
      tabBarItemStyle: { paddingTop: 7 },
    },
    optionsFor(key: string) {
      const tab = tabs.find((item) => item.key === key);
      if (!tab) throw new Error(`Unknown ${role} tab: ${key}`);
      return {
        title: t(tab.labelKey),
        tabBarIcon: ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
          <Ionicons name={focused ? tab.iconActive : tab.icon} color={color} size={size} />
        ),
      };
    },
  };
}
