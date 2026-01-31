import Cta from '@/components/marketing/sections/cta';
import Developers from '@/components/marketing/sections/developers';
import FeaturesGrid from '@/components/marketing/sections/features-grid';
import FunctionalMinimalism from '@/components/marketing/sections/functional-minimalism';
import Hero from '@/components/marketing/sections/hero';
import HowItWorks from '@/components/marketing/sections/how-it-works';
import Problem from '@/components/marketing/sections/problem';

const HomePage = async () => {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <FunctionalMinimalism />
      <Developers />
      <FeaturesGrid />
      <Cta />
    </>
  );
};

export default HomePage;
