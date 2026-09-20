import { EmptySection, Screen } from '@/components/screen';
import { useTranslation } from '@/providers/localization-provider';

export function FeatureScreen({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return <Screen title={t(titleKey)}><EmptySection /></Screen>;
}
