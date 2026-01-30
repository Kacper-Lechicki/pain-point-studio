import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';

const HomePage = async () => {
  const t = await getTranslations('HomePage');

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>

      <div>
        <Button>Click me</Button>
      </div>
    </main>
  );
};

export default HomePage;
