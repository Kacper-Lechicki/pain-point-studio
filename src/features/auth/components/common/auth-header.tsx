import { ArrowRight } from 'lucide-react';

import { AppRoute } from '@/config';
import { Link } from '@/i18n/routing';

interface AuthHeaderProps {
  title: string;
  description: string;
  linkText?: string;
  linkHref?: AppRoute;
}

const AuthHeader = ({ title, description, linkText, linkHref }: AuthHeaderProps) => {
  return (
    <div className="flex flex-col space-y-2 pb-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      <p className="text-muted-foreground text-sm">
        {description}

        {linkText && linkHref && (
          <>
            <ArrowRight className="mx-1.5 inline size-3" />
            <Link
              href={linkHref}
              className="hover:text-primary font-semibold underline underline-offset-4"
            >
              {linkText}
            </Link>
          </>
        )}
      </p>
    </div>
  );
};

export { AuthHeader };
