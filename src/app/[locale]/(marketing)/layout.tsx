import { Footer } from '@/features/marketing/components/layout/footer';
import { Navbar } from '@/features/marketing/components/layout/navbar';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout = ({ children }: MarketingLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="page-top-spacing p flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;
