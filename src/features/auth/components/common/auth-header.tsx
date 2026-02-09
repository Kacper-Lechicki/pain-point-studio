import { ArrowRight, type LucideIcon } from 'lucide-react';

import { AppRoute } from '@/config';
import { Link } from '@/i18n/routing';

interface AuthHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  linkText?: string;
  linkHref?: AppRoute;
}

const AuthHeader = ({ title, description, icon: Icon, linkText, linkHref }: AuthHeaderProps) => {
  return (
    <div className="flex flex-col space-y-2 pb-4 text-center">
      <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight">
        {Icon && <Icon className="text-muted-foreground size-5" />}
        {title}
      </h1>

      <p className="text-muted-foreground text-sm">
        {description}

        {linkText && linkHref && (
          <>
            <ArrowRight className="mx-1.5 inline size-3" />
            <Link
              href={linkHref}
              className="md:hover:text-primary font-semibold underline underline-offset-4"
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
