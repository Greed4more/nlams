import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Sidebar, SidebarContent } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

function RouteSkeleton() {
  return (
    <div className="space-y-3">
      <div className="shimmer h-9 w-64" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-24 w-full" />
        ))}
      </div>
      <div className="shimmer h-64 w-full" />
    </div>
  );
}

export function AppShell({
  breadcrumb,
  children,
}: {
  breadcrumb: string[];
  children: ReactNode;
}) {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />

      {/* Mobile nav drawer: below 768px */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="w-60 gap-0 border-none bg-navy p-0 text-navy-foreground [&_svg]:text-navy-foreground"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col md:pl-16 xl:pl-60">
        <TopBar breadcrumb={breadcrumb} onOpenNav={() => setNavOpen(true)} />
        <main className="flex-1 px-5 py-5">{loading ? <RouteSkeleton /> : children}</main>
        <footer className="border-t border-border px-5 py-2 text-center text-[10px] text-muted-foreground">
          NLAMS v0.9 · National Land Acquisition &amp; Management System · Department of Land
          Resources
        </footer>
      </div>
    </div>
  );
}
