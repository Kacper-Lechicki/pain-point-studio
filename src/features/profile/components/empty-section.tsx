interface EmptySectionProps {
  title: string;
  description: string;
}

const EmptySection = ({ title, description }: EmptySectionProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>

      <div className="bg-muted/20 rounded-lg border border-dashed p-6 text-center">
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
};

export { EmptySection };
