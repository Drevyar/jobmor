export type RegistrationRole = 'student' | 'employer';

export type RegistrationForm = {
  role: RegistrationRole;
  displayName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  businessCategory: string;
  customCategory: string;
  address: string;
};

export type RegistrationField = keyof RegistrationForm;
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;
