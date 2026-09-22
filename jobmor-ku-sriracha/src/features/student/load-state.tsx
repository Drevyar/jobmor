import { ActivityIndicator } from 'react-native';
import { Button, Card, Notice, useEmployerText } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';

export function StudentLoadState({ loading, error, reload }: { loading: boolean; error: string; reload: () => void }) {
  const { t } = useTranslation(); const e = useEmployerText();
  return loading ? <ActivityIndicator accessibilityLabel={e('loading')} /> : error ?
    <Card><Notice text={t(`studentFlow.${error}`)} error /><Button label={e('retry')} onPress={reload} /></Card> : null;
}
