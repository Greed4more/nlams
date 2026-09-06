import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { getSlaStatus } from "@/lib/slaRules";
import { useDemo, type HighlightKey } from "@/context/DemoContext";
import { useProposalsQuery } from "@/hooks/useProposals";
import { cn } from "@/lib/utils";

interface DemoStep {
  title: string;
  description: string;
  highlight: HighlightKey;
  verify?: boolean;
  run: () => void;
}

export function DemoPanel() {
  const navigate = useNavigate();
  const demo = useDemo();
  const { data: proposals } = useProposalsQuery();

  const demoProposal = useMemo(() => {
    const list = proposals ?? [];
    return (
      list.find((p) => getSlaStatus(p).status === "BREACHED" && p.documents.length > 0) ?? list[0]
    );
  }, [proposals]);

  const steps = useMemo<DemoStep[]>(() => {
    const id = demoProposal?.id ?? "";
    return [
      {
        title: "Statutory delay alerts",
        description: "The dashboard flags every proposal past its RFCTLARR clock.",
        highlight: "kpi-breaches",
        run: () => navigate({ to: "/" }),
      },
      {
        title: "Filter the pipeline",
        description: "Jump straight to breached proposals from the pipeline chips.",
        highlight: "pipeline-chips",
        run: () => navigate({ to: "/proposals" }),
      },
      {
        title: "Open a proposal",
        description: id
          ? `${id} — statutory status and stage timeline at a glance.`
          : "Statutory status and stage timeline at a glance.",
        highlight: "proposal-header",
        run: () => id && navigate({ to: "/proposals/$id", params: { id } }),
      },
      {
        title: "Verify filed documents",
        description: "Every filing is content-hashed — re-verify integrity on demand.",
        highlight: "document-repository",
        verify: true,
        run: () => id && navigate({ to: "/proposals/$id", params: { id } }),
      },
      {
        title: "Compute compensation",
        description: "Section 26 award breakdown with solatium and interest.",
        highlight: "calculator-breakdown",
        run: () => navigate({ to: "/calculator" }),
      },
    ];
  }, [navigate, demoProposal]);

  const go = (index: number) => {
    const step = steps[index];
    if (!step) return;
    demo.setActiveStep(index);
    step.run();
    window.setTimeout(() => {
      demo.spotlight(step.highlight);
      if (step.verify) demo.requestVerify();
    }, 280);
  };

  const reset = () => {
    demo.setActiveStep(null);
    demo.setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="label-xs">Guided walkthrough</div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" strokeWidth={2} />
          Reset demo
        </button>
      </div>

      <ol className="divide-y divide-border">
        {steps.map((step, i) => {
          const active = demo.activeStep === i;
          const done = demo.activeStep !== null && demo.activeStep > i;
          return (
            <li key={step.title}>
              <button
                type="button"
                onClick={() => go(i)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                  active && "bg-accent/60",
                )}
              >
                {done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-ok" />
                ) : (
                  <Circle
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      active ? "text-navy" : "text-muted-foreground/40",
                    )}
                  />
                )}
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-foreground">
                    {i + 1}. {step.title}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-border px-3 py-2 text-[10.5px] leading-snug text-muted-foreground">
        Steps navigate the live app and spotlight the relevant panel.
      </div>
    </div>
  );
}
