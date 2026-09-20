import { Tabs } from 'expo-router';
import { useRoleTabs } from '@/hooks/use-role-tabs';

export default function EmployerLayout() {
  const { screenOptions, optionsFor, tabBar } = useRoleTabs('employer');
  return <Tabs screenOptions={screenOptions} tabBar={tabBar}>
    <Tabs.Screen name="dashboard" options={optionsFor('dashboard')} />
    <Tabs.Screen name="jobs" options={optionsFor('jobs')} />
    <Tabs.Screen name="applicants" options={optionsFor('applicants')} />
    <Tabs.Screen name="messages" options={optionsFor('messages')} />
    <Tabs.Screen name="profile" options={optionsFor('profile')} />
    <Tabs.Screen name="create-job" options={{ href: null }} />
  </Tabs>;
}
