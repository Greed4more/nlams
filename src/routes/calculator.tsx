import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CompensationCalculator } from "@/components/calculator/CompensationCalculator";

export const Route = createFileRoute("/calculator")({
  validateSearch: (search: Record<string, unknown>): { ulpin?: string } => ({
    ...(typeof search["ulpin"] === "string" ? { ulpin: search["ulpin"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Section 26 Compensation Calculator — NLAMS" },
      {
        name: "description",
        content:
          "Compute RFCTLARR award compensation: market value, First Schedule factor, Sec 29 assets, solatium and Sec 30(3) interest.",
      },
      { property: "og:title", content: "Section 26 Compensation Calculator — NLAMS" },
      {
        property: "og:description",
        content: "Statutory award computation with solatium, multiplication factor and interest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  return (
    <AppShell breadcrumb={["NLAMS", "Compensation Calculator"]}>
      <PageHeader
        title="Section 26 Compensation Calculator"
        subtitle="Award computation under the RFCTLARR Act, 2013 — First Schedule multiplication factor, Sec 29 assets, Sec 30 solatium and interest."
      />
      <CompensationCalculator />
    </AppShell>
  );
}
