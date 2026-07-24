export function ProgressBar({
  current,
  total,
  label,
  colorClassName = "bg-teal-500",
}: {
  current: number;
  total: number;
  label?: string;
  colorClassName?: string;
}) {
  const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;
  return (
    <div>
      {label ? <p className="mb-1.5 text-sm font-semibold text-navy-700">{label}</p> : null}
      <div className="h-3 w-full overflow-hidden rounded-full bg-navy-100">
        <div
          className={`h-full rounded-full ${colorClassName} transition-[width] duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
