type WorkspaceItemProps = {
  title: string;
  description?: string;
  metaTop?: string;
  metaBottom?: string;
  href?: string;
};

export function WorkspaceItem({
  title,
  description,
  metaTop,
  metaBottom,
}: WorkspaceItemProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {(metaTop || metaBottom) && (
        <div className="text-right text-sm">
          {metaTop && <p className="font-medium">{metaTop}</p>}
          {metaBottom && <p className="text-slate-500">{metaBottom}</p>}
        </div>
      )}
    </div>
  );
}