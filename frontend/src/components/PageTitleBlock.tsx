interface PageTitleBlockProps {
  title: string;
  subtitle?: string;
}

export function PageTitleBlock({ title, subtitle }: PageTitleBlockProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-display text-foreground">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
