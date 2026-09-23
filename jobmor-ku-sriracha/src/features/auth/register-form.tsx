import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerAccount, resendSignupConfirmation } from '@/features/auth/auth-service';
import type {
  RegistrationErrors,
  RegistrationField,
  RegistrationForm,
  RegistrationRole,
} from '@/features/auth/types';
import { validateRegistration } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

const CATEGORY_KEYS = [
  'food',
  'retail',
  'hospitality',
  'education',
  'events',
  'office',
  'technology',
  'logistics',
] as const;

const initialForm = (role: RegistrationRole): RegistrationForm => ({
  role,
  displayName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  businessCategory: '',
  customCategory: '',
  address: '',
});

type FormFieldProps = {
  field: RegistrationField;
  label: string;
  value: string;
  errors: RegistrationErrors;
  onChange: (field: RegistrationField, value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  helperText?: string;
};

export function RegisterForm({ initialRole, onBack }: { initialRole: RegistrationRole; onBack: () => void }) {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const submissionLock = useRef(false);
  const [form, setForm] = useState(() => initialForm(initialRole));
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [showCategories, setShowCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationResent, setConfirmationResent] = useState(false);
  const [resendError, setResendError] = useState('');

  const resendConfirmation = async () => {
    setResendingConfirmation(true);
    setResendError('');
    setConfirmationResent(false);
    try {
      await resendSignupConfirmation(registeredEmail);
      setConfirmationResent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setResendError(message || t('auth.confirmationResendFailed'));
    } finally {
      setResendingConfirmation(false);
    }
  };

  const updateField = (field: RegistrationField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError('');
  };

  const submit = async () => {
    // Stop duplicate pointer/touch events before React can rerender the disabled button.
    if (submissionLock.current) return;
    submissionLock.current = true;
    console.log('[RegisterForm] submit triggered. form role:', form.role);
    const nextErrors = validateRegistration(form);
    setErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some((err) => Boolean(err));
    if (hasErrors) {
      console.warn('[RegisterForm] validation errors:', nextErrors);
      const errorList: string[] = [];
      if (nextErrors.displayName) errorList.push(form.role === 'student' ? 'ชื่อ–นามสกุล' : 'ชื่อผู้ติดต่อ');
      if (nextErrors.email === 'kuEmailOnly') errorList.push('อีเมลต้องลงท้ายด้วย @ku.th (สำหรับนิสิต)');
      else if (nextErrors.email) errorList.push('รูปแบบอีเมลไม่ถูกต้อง');
      if (nextErrors.phone) errorList.push('เบอร์โทรศัพท์ (ต้องมี 8–20 ตัวเลข)');
      if (nextErrors.companyName) errorList.push('ชื่อร้าน / บริษัท');
      if (nextErrors.businessCategory) errorList.push('เลือกประเภทธุรกิจ');
      if (nextErrors.customCategory) errorList.push('ระบุประเภทธุรกิจ');
      if (nextErrors.address) errorList.push('ที่อยู่ร้าน / บริษัท');
      if (nextErrors.password === 'passwordFormat') errorList.push('รหัสผ่านต้องมีทั้งตัวพิมพ์ใหญ่ (A-Z), ตัวพิมพ์เล็ก (a-z) และตัวเลข (0-9)');
      else if (nextErrors.password === 'passwordLength') errorList.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      if (nextErrors.confirmPassword) errorList.push('รหัสผ่านยืนยันไม่ตรงกับรหัสผ่าน');

      setSubmitError(`กรุณาตรวจสอบข้อมูล:\n• ${errorList.join('\n• ')}`);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      submissionLock.current = false;
      return;
    }

    console.log('[RegisterForm] validation passed, registering account...');
    setSubmitting(true);
    setSubmitError('');
    try {
      await registerAccount(form);
      console.log('[RegisterForm] registration request accepted. Email delivery is not guaranteed.');
      setRegisteredEmail(form.email.trim().toLowerCase());
    } catch (error) {
      console.warn('[RegisterForm] registration error:', error);
      const msg = error instanceof Error ? error.message : '';
      let detail = msg;
      if (msg.toLowerCase().includes('rate limit')) {
        detail = 'โควตาส่งอีเมลยืนยันเกินกำหนดชั่วคราว กรุณารอสักครู่แล้วลองใหม่';
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already registered')) {
        detail = 'อีเมลนี้ถูกลงทะเบียนไปแล้ว กรุณาเข้าสู่ระบบ';
      } else if (msg.toLowerCase().includes('database error')) {
        detail = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบข้อมูลและลองใหม่';
      }
      setSubmitError(`${t('auth.registerFailed')}${detail ? ` (${detail})` : ''}`);
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="mail-unread-outline" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>{t('auth.checkEmail')}</Text>
          <Text style={[styles.successBody, { color: colors.textMuted }]}>{t('auth.checkEmailBody')}</Text>
          <Text style={[styles.successEmail, { color: colors.primary }]}>{registeredEmail}</Text>
          {confirmationResent ? (
            <Text style={[styles.successBody, { color: colors.primary }]}>{t('auth.confirmationResent')}</Text>
          ) : null}
          {resendError ? (
            <Text style={[styles.submitError, { color: colors.danger, backgroundColor: colors.surface }]}>{resendError}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={resendingConfirmation}
            onPress={() => void resendConfirmation()}
            style={[styles.resendButton, { borderColor: colors.border, backgroundColor: colors.surface }, resendingConfirmation && styles.disabled]}>
            {resendingConfirmation ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={[styles.resendButtonText, { color: colors.primary }]}>
              {t(resendingConfirmation ? 'auth.sendingEmail' : 'auth.resendConfirmation')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/login')}
            style={[styles.primaryButton, { width: '100%', backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{t('auth.login')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={[styles.resendButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.resendButtonText, { color: colors.primary }]}>{t('auth.backHome')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const fieldProps = { errors, onChange: updateField };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
          <View style={styles.topBar}>
            <Pressable onPress={onBack} accessibilityLabel={t('auth.back')} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>
            <Pressable onPress={toggleLanguage} style={[styles.languageButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="language-outline" size={18} color={colors.primary} />
              <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
            </Pressable>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t(form.role === 'student' ? 'auth.registerStudent' : 'auth.registerEmployer')}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t(form.role === 'student' ? 'auth.studentHint' : 'auth.employerHint')}</Text>

          <View style={styles.form}>
            <FormField {...fieldProps} field="displayName" label={t(form.role === 'student' ? 'auth.name' : 'auth.contactName')} value={form.displayName} autoCapitalize="words" />
            <FormField
              {...fieldProps}
              field="email"
              label={t('auth.email')}
              value={form.email}
              keyboardType="email-address"
              autoCapitalize="none"
              helperText={form.role === 'student' ? 'ใช้อีเมลนิสิต (@ku.th) เท่านั้น' : undefined}
            />
            <FormField
              {...fieldProps}
              field="phone"
              label={t('auth.phone')}
              value={form.phone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              helperText="เบอร์โทรศัพท์ 8–20 หลัก (เช่น 0812345678)"
            />

            {form.role === 'employer' ? (
              <>
                <FormField {...fieldProps} field="companyName" label={t('auth.companyName')} value={form.companyName} autoCapitalize="words" />
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('auth.category')}</Text>
                  <Pressable onPress={() => setShowCategories((current) => !current)} style={[styles.input, styles.select, { backgroundColor: colors.surface, borderColor: errors.businessCategory ? colors.danger : colors.border }]}>
                    <Text style={[styles.inputText, { color: form.businessCategory ? colors.text : colors.textMuted }]}>{form.businessCategory ? t(form.businessCategory === 'other' ? 'auth.other' : `auth.categories.${form.businessCategory}`) : t('auth.chooseCategory')}</Text>
                    <Ionicons name={showCategories ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </Pressable>
                  {errors.businessCategory ? <Text style={[styles.errorText, { color: colors.danger }]}>{t(`auth.${errors.businessCategory}`)}</Text> : null}
                  {showCategories ? (
                    <View style={[styles.categoryMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {CATEGORY_KEYS.map((category) => (
                        <Pressable key={category} onPress={() => { updateField('businessCategory', category); setShowCategories(false); }} style={styles.categoryOption}>
                          <Text style={[styles.categoryText, { color: colors.text }]}>{t(`auth.categories.${category}`)}</Text>
                        </Pressable>
                      ))}
                      <Pressable onPress={() => { updateField('businessCategory', 'other'); setShowCategories(false); }} style={styles.categoryOption}>
                        <Text style={[styles.categoryText, { color: colors.text }]}>{t('auth.other')}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                {form.businessCategory === 'other' ? <FormField {...fieldProps} field="customCategory" label={t('auth.customCategory')} value={form.customCategory} autoCapitalize="words" /> : null}
                <FormField {...fieldProps} field="address" label={t('auth.address')} value={form.address} multiline autoCapitalize="sentences" />
              </>
            ) : null}

            <FormField
              {...fieldProps}
              field="password"
              label={t('auth.password')}
              value={form.password}
              secureTextEntry
              autoCapitalize="none"
              helperText="อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข"
            />
            <FormField {...fieldProps} field="confirmPassword" label={t('auth.confirmPassword')} value={form.confirmPassword} secureTextEntry autoCapitalize="none" />
          </View>

          {submitError ? <Text style={[styles.submitError, { color: colors.danger, backgroundColor: colors.surface }]}>{submitError}</Text> : null}

          <Pressable
            disabled={submitting}
            onPress={submit}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              submitting && styles.disabled,
              Platform.OS === 'web' && ({ cursor: submitting ? 'not-allowed' : 'pointer' } as any),
            ]}>
            {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Ionicons name="person-add-outline" size={19} color={colors.onPrimary} />}
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{t(submitting ? 'auth.submitting' : 'auth.submit')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({ field, label, value, errors, onChange, keyboardType, secureTextEntry, multiline, autoCapitalize = 'sentences', helperText }: FormFieldProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const error = errors[field];
  const isPasswordField = !!secureTextEntry;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={isPasswordField ? styles.passwordWrapper : undefined}>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(field, text)}
          keyboardType={keyboardType}
          secureTextEntry={isPasswordField && !showPassword}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            multiline && styles.multiline,
            isPasswordField && styles.passwordInput,
            { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
          ]}
        />
        {isPasswordField ? (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{t(`auth.${error}`)}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1 }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 22, paddingBottom: 48 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }, iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  languageButton: { height: 38, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }, languageText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 27, fontWeight: '900' }, hint: { fontSize: 13, marginTop: 5, marginBottom: 20 },
  form: { gap: 15 }, field: { gap: 6 }, label: { fontSize: 13, fontWeight: '700' }, input: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 }, multiline: { minHeight: 92, paddingTop: 13, textAlignVertical: 'top' },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 44 },
  eyeButton: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center', paddingHorizontal: 4 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, inputText: { fontSize: 14 }, errorText: { fontSize: 12, lineHeight: 17 },
  helperText: { fontSize: 12, lineHeight: 16 },
  categoryMenu: { borderWidth: 1, borderRadius: 15, paddingVertical: 5 }, categoryOption: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14 }, categoryText: { fontSize: 14 },
  submitError: { marginTop: 18, padding: 13, borderRadius: 13, fontSize: 12, lineHeight: 18 }, primaryButton: { minHeight: 52, marginTop: 22, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 }, primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, disabled: { opacity: 0.65 },
  successContent: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 28 }, successIcon: { width: 76, height: 76, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, successTitle: { marginTop: 20, fontSize: 26, fontWeight: '900', textAlign: 'center' }, successBody: { marginTop: 9, maxWidth: 360, fontSize: 14, lineHeight: 21, textAlign: 'center' }, successEmail: { marginTop: 12, fontSize: 14, fontWeight: '800' }, resendButton: { width: '100%', minHeight: 50, marginTop: 18, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, resendButtonText: { fontSize: 14, fontWeight: '800' },
});
