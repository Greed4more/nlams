/** Thin breadcrumb strip under the main nav bar. */
export function TopBar({ breadcrumb }: { breadcrumb: string[] }) {
  return (
    <div className="flex h-9 items-center border-b border-border bg-muted/30 px-3 sm:px-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[12.5px]">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex min-w-0 items-center gap-2">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "truncate font-semibold text-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>
    </div>
  );
}
