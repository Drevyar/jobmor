import { Tabs } from 'expo-router';
import { useRoleTabs } from '@/hooks/use-role-tabs';

export default function StudentLayout() {
  const { screenOptions, optionsFor } = useRoleTabs('student');
  return <Tabs screenOptions={screenOptions}>
    <Tabs.Screen name="home" options={optionsFor('home')} />
    <Tabs.Screen name="explore" options={optionsFor('explore')} />
    <Tabs.Screen name="applications" options={optionsFor('applications')} />
    <Tabs.Screen name="messages" options={optionsFor('messages')} />
    <Tabs.Screen name="profile" options={optionsFor('profile')} />
  </Tabs>;
}
