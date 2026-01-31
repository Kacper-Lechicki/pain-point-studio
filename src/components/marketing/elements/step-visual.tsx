import { LucideIcon } from 'lucide-react';

interface StepVisualProps {
  icon: LucideIcon | React.ElementType;
  label: string;
}

const StepVisual = ({ icon: Icon, label }: StepVisualProps) => {
  return (
    <div className="bg-muted/50 flex aspect-video w-full items-center justify-center rounded-3xl border border-dashed sm:aspect-2/1 lg:aspect-video">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-background rounded-2xl border p-4 shadow-sm">
          <Icon className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <span className="text-muted-foreground text-xs font-medium sm:text-sm">{label}</span>
      </div>
    </div>
  );
};

export default StepVisual;
