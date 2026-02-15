import { getTranslations } from 'next-intl/server';

export async function TermsText() {
  const t = await getTranslations();

  return (
    <p className="text-muted-foreground pt-4 text-center text-xs">
      {t('auth.termsAgreement')}
      <span className="mt-1 block">
        <span className="md:hover:text-primary underline underline-offset-4">
          {t('auth.terms')}
        </span>{' '}
        {t('auth.and')}{' '}
        <span className="md:hover:text-primary underline underline-offset-4">
          {t('auth.privacy')}
        </span>
        .
      </span>
    </p>
  );
}
