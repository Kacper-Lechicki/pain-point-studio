import type { ReactNode } from 'react';

interface SurveyLayoutProps {
  children: ReactNode;
}

const SurveyLayout = ({ children }: SurveyLayoutProps) => {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center">
      <main className="w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    </div>
  );
};

export default SurveyLayout;
