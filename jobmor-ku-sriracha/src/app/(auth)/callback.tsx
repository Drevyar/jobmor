import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export default function AuthCallbackScreen() {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t('auth.verifiedTitle')}</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{t('auth.verifiedBody')}</Text>
        <Pressable
          onPress={() => router.replace('/')}
          style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t('auth.backHome')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 24, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  body: { marginTop: 10, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: {
    width: '100%',
    minHeight: 52,
    marginTop: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
