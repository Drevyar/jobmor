import { AuthenticatedProfileScreen } from '@/features/auth/authenticated-profile-screen';
import { StudentProfileForm } from '@/features/student/profile-form';

export default function ProfileScreen() {
  return <AuthenticatedProfileScreen titleKey="student.profile"><StudentProfileForm /></AuthenticatedProfileScreen>;
}
