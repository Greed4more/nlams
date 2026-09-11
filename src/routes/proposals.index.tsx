import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProposalPipeline } from "@/components/proposals/ProposalPipeline";
import { NewProposalDialog } from "@/components/proposals/NewProposalDialog";
import { useI18n } from "@/context/I18nContext";

export const Route = createFileRoute("/proposals/")({
  validateSearch: (search: Record<string, unknown>): { filter?: string; focus?: string } => ({
    ...(typeof search["filter"] === "string" ? { filter: search["filter"] } : {}),
    ...(typeof search["focus"] === "string" ? { focus: search["focus"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Proposal Pipeline — BHUMITRA" },
      {
        name: "description",
        content:
          "Register of RFCTLARR land acquisition proposals with stage progress, ULPIN parcels and statutory SLA status.",
      },
      { property: "og:title", content: "Proposal Pipeline — BHUMITRA" },
      {
        property: "og:description",
        content:
          "Search and filter acquisition proposals by state, requiring body, stage and SLA status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProposalsPage,
});

function ProposalsPage() {
  const { t } = useI18n();
  return (
    <AppShell breadcrumb={["Home", "Proposals"]}>
      <PageHeader
        title={t("page.proposals.title")}
        subtitle="All acquisition proposals recorded against notified requiring bodies"
        actions={<NewProposalDialog />}
      />
      <ProposalPipeline />
    </AppShell>
  );
}
