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
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      <p className="text-muted-foreground text-sm">
        {description}

        {linkText && linkHref && (
          <Link href={linkHref} className="text-primary ml-1 hover:underline">
            {linkText}
          </Link>
        )}
      </p>
    </div>
  );
};

export { AuthHeader };
