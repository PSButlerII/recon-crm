type WorkspaceSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function WorkspaceSection({
  title,
  description,
  children,
}: WorkspaceSectionProps) {
  return (
    <div className="rounded-xl border">
      <div className="border-b p-4">
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>

      {children}
    </div>
  );
}