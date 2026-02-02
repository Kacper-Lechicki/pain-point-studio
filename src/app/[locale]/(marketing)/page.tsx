import Cta from '@/app/[locale]/(marketing)/_components/cta';
import Developers from '@/app/[locale]/(marketing)/_components/developers';
import FeaturesGrid from '@/app/[locale]/(marketing)/_components/features-grid';
import FunctionalMinimalism from '@/app/[locale]/(marketing)/_components/functional-minimalism';
import Hero from '@/app/[locale]/(marketing)/_components/hero';
import HowItWorks from '@/app/[locale]/(marketing)/_components/how-it-works';
import Problems from '@/app/[locale]/(marketing)/_components/problems';

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
