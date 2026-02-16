import dynamic from 'next/dynamic';

import Hero from '@/app/[locale]/(marketing)/_components/hero';
import { routing } from '@/i18n/routing';

const Cta = dynamic(() => import('@/app/[locale]/(marketing)/_components/cta'), {
  loading: () => null,
});

const Developers = dynamic(() => import('@/app/[locale]/(marketing)/_components/developers'), {
  loading: () => null,
});

const FeaturesGrid = dynamic(() => import('@/app/[locale]/(marketing)/_components/features-grid'), {
  loading: () => null,
});

const FunctionalMinimalism = dynamic(
  () => import('@/app/[locale]/(marketing)/_components/functional-minimalism'),
  { loading: () => null }
);

const HowItWorks = dynamic(() => import('@/app/[locale]/(marketing)/_components/how-it-works'), {
  loading: () => null,
});

const Problems = dynamic(() => import('@/app/[locale]/(marketing)/_components/problems'), {
  loading: () => null,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const HomePage = async () => {
  return (
    <>
      <Hero />
      <Problems />
      <HowItWorks />
      <FunctionalMinimalism />
      <Developers />
      <FeaturesGrid />
      <Cta />
    </>
  );
};

export default HomePage;
