import type { ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 px-8 py-12 text-center text-neutral-400">
      <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
      <p className="max-w-md text-sm text-neutral-400">{description}</p>
      {action}
    </div>
  );
}
