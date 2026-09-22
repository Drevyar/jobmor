import { Tabs } from 'expo-router';
import { useRoleTabs } from '@/hooks/use-role-tabs';

export default function AdminLayout() {
  const { screenOptions, optionsFor, tabBar } = useRoleTabs('admin');
  return <Tabs screenOptions={screenOptions} tabBar={tabBar}>
    <Tabs.Screen name="dashboard" options={optionsFor('dashboard')} />
    <Tabs.Screen name="users" options={optionsFor('users')} />
    <Tabs.Screen name="jobs" options={optionsFor('jobs')} />
    <Tabs.Screen name="reports" options={optionsFor('reports')} />
    <Tabs.Screen name="profile" options={optionsFor('profile')} />
  </Tabs>;
}
