import { getTranslations } from 'next-intl/server';

export async function TermsText() {
  const t = await getTranslations('auth');

  return (
    <p className="text-muted-foreground px-8 text-center text-sm">
      {t('termsAgreement')}{' '}
      <span className="hover:text-primary underline underline-offset-4">{t('terms')}</span>{' '}
      {t('and')}{' '}
      <span className="hover:text-primary underline underline-offset-4">{t('privacy')}</span>.
    </p>
  );
}
