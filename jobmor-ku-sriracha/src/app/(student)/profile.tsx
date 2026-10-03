import { AuthenticatedProfileScreen } from '@/features/auth/authenticated-profile-screen';
import { StudentProfileForm } from '@/features/student/profile-form';
import { WorkContextPanel } from '@/features/employer-ai/work-context-panel';
import { PreferencesPanel } from '@/features/student-ai/panels';

export default function ProfileScreen() {
  return <AuthenticatedProfileScreen titleKey="student.profile"><StudentProfileForm /><WorkContextPanel /><PreferencesPanel /></AuthenticatedProfileScreen>;
}
