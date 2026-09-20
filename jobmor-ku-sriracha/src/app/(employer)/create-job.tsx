import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export default function CreateJobScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const fields = ['jobTitle', 'jobType', 'wage', 'location', 'dateTime', 'skills', 'description'] as const;
  return (
    <Screen title={t('employer.createJob')} subtitle={t('employer.createSubtitle')}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color={colors.primary} /><Text style={[styles.backText, { color: colors.primary }]}>{t('employer.dashboard')}</Text></Pressable>
      <View style={styles.form}>
        {fields.map((field) => <View key={field} style={styles.field}><Text style={[styles.label, { color: colors.text }]}>{t(`employer.${field}`)}</Text><TextInput editable={false} style={[styles.input, field === 'description' && styles.multiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} multiline={field === 'description'} /></View>)}
      </View>
      <View style={[styles.publish, { backgroundColor: colors.primary }]}><Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" /><Text style={styles.publishText}>{t('employer.publish')}</Text></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7 }, backText: { fontSize: 13, fontWeight: '700' }, form: { gap: 15 }, field: { gap: 7 }, label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 }, multiline: { minHeight: 112, textAlignVertical: 'top', paddingTop: 12 }, publish: { minHeight: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, publishText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
