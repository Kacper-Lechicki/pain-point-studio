interface StepVisualProps {
  icon: React.ElementType;
  label: string;
  chart?: React.ElementType | undefined;
}

const StepVisual = ({ icon: Icon, label, chart: Chart }: StepVisualProps) => {
  return (
    <div className="bg-muted/50 relative flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed text-center sm:aspect-video">
      {Chart ? (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <Chart />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-background rounded-lg border p-4 shadow-sm">
            <Icon className="text-muted-foreground size-8 sm:size-10" aria-hidden="true" />
          </div>

          <span className="text-muted-foreground text-xs font-medium sm:text-sm">{label}</span>
        </div>
      )}
    </div>
  );
};

export { StepVisual };
