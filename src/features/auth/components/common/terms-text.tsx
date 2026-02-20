import { getTranslations } from 'next-intl/server';

export async function TermsText() {
  const t = await getTranslations('auth');

  return (
    <p className="text-muted-foreground pt-4 text-center text-xs">
      {t('termsAgreement')}
      <span className="mt-1 block">
        <span className="md:hover:text-primary underline underline-offset-4">{t('terms')}</span>{' '}
        {t('and')}{' '}
        <span className="md:hover:text-primary underline underline-offset-4">{t('privacy')}</span>.
      </span>
    </p>
  );
}
