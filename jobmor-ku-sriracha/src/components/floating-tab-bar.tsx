import { Tabs } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

type TabsProps = ComponentProps<typeof Tabs>;
type FloatingTabBarProps = Parameters<NonNullable<TabsProps['tabBar']>>[0];

const BAR_HEIGHT = 76;
const ANIMATION_DURATION = 240;

export function renderFloatingTabBar(props: FloatingTabBarProps) {
  return <FloatingTabBar {...props} />;
}

function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [contentWidth, setContentWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [keyboardFocused, setKeyboardFocused] = useState<string | null>(null);
  const horizontalInset = Math.max(12, (width - 560) / 2);
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    // Expo Router converts href: null into a hidden tab item before descriptors
    // reach this custom bar. Exclude it from both rendering and width calculations.
    return StyleSheet.flatten(options.tabBarItemStyle)?.display !== 'none';
  });
  const activeRoute = state.routes[state.index];
  const activeIndex = visibleRoutes.findIndex((route) => route.key === activeRoute.key);
  const itemWidth = visibleRoutes.length ? contentWidth / visibleRoutes.length : 0;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; listener.remove(); };
  }, []);

  useEffect(() => {
    if (activeIndex < 0) return;

    Animated.timing(progress, {
      toValue: activeIndex,
      duration: reduceMotion ? 0 : ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [activeIndex, progress, reduceMotion]);

  return (
    <View
      style={[
        styles.bar,
        {
          left: horizontalInset,
          right: horizontalInset,
          bottom: Math.max(10, insets.bottom),
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        Platform.select({
          web: { boxShadow: '0 8px 20px rgba(0, 0, 0, 0.14)' },
          default: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 14,
            elevation: 10,
          },
        }),
      ]}
    >
      <View
        style={styles.items}
        onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}
      >
        {itemWidth > 0 && activeIndex >= 0 ? (
          <Animated.View
            style={[
              styles.indicator,
              {
                left: 3,
                width: Math.max(0, itemWidth - 6),
                backgroundColor: colors.primarySoft,
                transform: [{ translateX: Animated.multiply(progress, itemWidth) }],
              },
            ]}
          />
        ) : null}

        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = route.key === activeRoute.key;
          const label = options.tabBarAccessibilityLabel
            ?? (typeof options.title === 'string' ? options.title : route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              onHoverIn={() => setHighlighted(route.key)}
              onHoverOut={() => setHighlighted(null)}
              onFocus={() => setKeyboardFocused(route.key)}
              onBlur={() => setKeyboardFocused(null)}
              style={({ pressed }) => [styles.item, { backgroundColor: pressed || highlighted === route.key ? colors.primarySoft : 'transparent', borderColor: keyboardFocused === route.key ? colors.primary : 'transparent' }]}
            >
              {options.tabBarIcon?.({
                focused,
                color: focused ? colors.primary : colors.textMuted,
                size: 22,
              })}
              <Text numberOfLines={1} style={[styles.label, { color: focused ? colors.primary : colors.textMuted, fontWeight: focused ? '700' : '500' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    padding: 6,
    borderWidth: 1,
    borderRadius: 25,
  },
  items: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    bottom: 0,
    borderRadius: 16,
  },
  item: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    minWidth: 0,
  },
  label: { fontSize: 11, lineHeight: 16, maxWidth: '100%' },
});
