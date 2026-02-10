import { PageTransition } from '@/components/ui/page-transition';

export default async function DashboardPage() {
  return (
    <PageTransition>
      <div className="px-6 pt-4 pb-8 sm:px-4 md:pt-8 lg:px-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
    </PageTransition>
  );
}
