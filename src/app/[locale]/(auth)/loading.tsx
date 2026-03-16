import { Skeleton } from '@/components/ui/skeleton';

const AuthLoading = () => {
  return (
    <>
      <div className="flex flex-col items-center space-y-2 pb-4">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>

          <Skeleton className="ml-auto h-4 w-28" />
          <Skeleton className="mt-2 h-9 w-full" />
        </div>

        <div className="space-y-4">
          <div className="relative flex justify-center py-1.5">
            <Skeleton className="h-6 w-28 rounded-md" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>

      <Skeleton className="mx-auto h-4 w-64" />
    </>
  );
};

export default AuthLoading;
