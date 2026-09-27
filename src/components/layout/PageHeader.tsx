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
    <div className="mb-4 border-b border-border pb-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="font-serif text-[23px] font-semibold leading-tight tracking-tight text-navy">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-3xl text-[12px] leading-snug text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions}
      </div>
      <span aria-hidden className="tricolour-rule mt-3 block h-[3px] w-16" />
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
