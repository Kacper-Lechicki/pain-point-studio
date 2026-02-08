import { PageTransition } from '@/components/ui/page-transition';

export default async function DashboardPage() {
  return (
    <PageTransition>
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
    </PageTransition>
  );
}
