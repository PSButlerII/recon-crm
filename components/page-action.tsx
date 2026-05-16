type PageActionsProps = {
  children: React.ReactNode;
};

export function PageActions({ children }: PageActionsProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}