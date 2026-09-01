import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Placeholder({ note }: { note: string }) {
  return (
    <div className="panel grid min-h-[280px] place-items-center p-8 text-center">
      <div>
        <div className="label-xs">Module pending</div>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}
