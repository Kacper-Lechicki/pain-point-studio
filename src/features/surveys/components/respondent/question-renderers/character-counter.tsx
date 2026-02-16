interface CharacterCounterProps {
  current: number;
  max: number | undefined;
}

export function CharacterCounter({ current, max }: CharacterCounterProps) {
  if (!max) {
    return null;
  }

  return (
    <p className="text-muted-foreground mt-1.5 text-right text-xs">
      {current} / {max}
    </p>
  );
}
