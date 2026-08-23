interface FieldMessageProps {
  error?: string;
  hint?: string;
}

export function FieldMessage({ error, hint }: FieldMessageProps) {
  if (error) return <p className="text-xs text-destructive">{error}</p>;
  if (hint) return <p className="text-xs text-muted-foreground">{hint}</p>;
  return null;
}
