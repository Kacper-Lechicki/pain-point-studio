import { LucideIcon } from 'lucide-react';

interface StepVisualProps {
  icon: LucideIcon | React.ElementType;
  label: string;
  chart?: React.ElementType | undefined;
}

const StepVisual = ({ icon: Icon, label, chart: Chart }: StepVisualProps) => {
  return (
    <div className="bg-muted/50 relative flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed text-center sm:aspect-video">
      {Chart ? (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <Chart />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-background rounded-2xl border p-4 shadow-sm">
            <Icon className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
          </div>

          <span className="text-muted-foreground text-xs font-medium sm:text-sm">{label}</span>
        </div>
      )}
    </div>
  );
};

export default StepVisual;
