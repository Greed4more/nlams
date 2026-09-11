import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Masthead } from "./Masthead";
import { TopNav, MobileNavList } from "./TopNav";
import { TopBar } from "./TopBar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

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

export function AppShell({ breadcrumb, children }: { breadcrumb: string[]; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);
  const { loading: authLoading, session, role } = useAuth();

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    if (!authLoading && !session) {
      void navigate({ to: "/sign-in" });
    }
  }, [authLoading, session, navigate]);

  if (authLoading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="shimmer h-9 w-64" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-4">
        <div className="panel max-w-sm p-6 text-center">
          <div className="label-xs">No role assigned</div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            This account isn't mapped to a BHUMITRA role yet. An admin needs to set
            app_metadata.role in Supabase for this user.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="print:hidden">
        <Masthead onOpenNav={() => setNavOpen(true)} />
        <TopNav />
      </div>

      {/* Mobile nav drawer: below 768px */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="w-60 gap-0 border-none bg-navy p-0 text-navy-foreground [&_svg]:text-navy-foreground"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <MobileNavList onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-col print:pl-0">
        <div className="print:hidden">
          <TopBar breadcrumb={breadcrumb} />
        </div>
        <main className="flex-1 px-5 py-5 print:px-0 print:py-0">
          {loading ? <RouteSkeleton /> : children}
        </main>
        <footer className="border-t border-border px-5 py-2 text-center text-[10px] text-muted-foreground print:hidden">
          BHUMITRA v0.9 · National Land Acquisition &amp; Management System · Department of Land
          Resources
        </footer>
      </div>
    </div>
  );
}
