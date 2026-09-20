import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';

import { renderFloatingTabBar } from '@/components/floating-tab-bar';
import { ROLE_CONFIGS } from '@/constants/roles';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import type { UserRole } from '@/types/user';

export function useRoleTabs(role: UserRole) {
  const colors = useTheme();
  const { t } = useTranslation();
  const tabs = ROLE_CONFIGS[role].tabs;

  return {
    tabBar: renderFloatingTabBar,
    screenOptions: {
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarHideOnKeyboard: true,
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
