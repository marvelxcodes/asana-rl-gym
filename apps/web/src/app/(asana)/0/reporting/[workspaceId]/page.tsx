"use client";

import { AsanaLayout } from "@/components/asana-layout";
import { AsanaUpsellModal } from "@/components/asana-upsell-modal";

type PageParams = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default function ReportingPage({ params }: PageParams) {
  const handleViewChange = () => {
    // No-op for upsell pages
  };

  const handleNavigate = () => {
    // No-op for upsell pages
  };

  const handleCustomize = () => {
    // No-op for upsell pages
  };

  const handleShare = () => {
    // No-op for upsell pages
  };

  return (
    <AsanaLayout
      currentView="list"
      onCustomize={handleCustomize}
      onNavigate={handleNavigate}
      onShare={handleShare}
      onViewChange={handleViewChange}
      title="Reporting"
    >
      <AsanaUpsellModal
        title="Uncover the state of your team's work"
        description="Generate real-time reports with customizable charts. Start a free trial to unlock it now."
        learnMoreUrl="https://asana.com/guide/help/premium/reporting"
      />
    </AsanaLayout>
  );
}
