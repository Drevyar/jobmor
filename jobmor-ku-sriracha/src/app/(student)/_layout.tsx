import { Tabs } from 'expo-router';
import { useRoleTabs } from '@/hooks/use-role-tabs';

export default function StudentLayout() {
  const { screenOptions, optionsFor, tabBar } = useRoleTabs('student');
  return <Tabs screenOptions={screenOptions} tabBar={tabBar}>
    <Tabs.Screen name="home" options={optionsFor('home')} />
    <Tabs.Screen name="explore" options={optionsFor('explore')} />
    <Tabs.Screen name="applications" options={optionsFor('applications')} />
    <Tabs.Screen name="messages" options={optionsFor('messages')} />
    <Tabs.Screen name="profile" options={optionsFor('profile')} />
  </Tabs>;
}
