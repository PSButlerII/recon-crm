type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="p-4 text-sm text-slate-500">
      {message}
    </div>
  );
}