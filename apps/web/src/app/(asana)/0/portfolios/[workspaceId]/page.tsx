"use client";

import { AsanaLayout } from "@/components/asana-layout";
import { AsanaUpsellModal } from "@/components/asana-upsell-modal";

type PageParams = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default function PortfoliosPage({ params }: PageParams) {
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
      title="Portfolios"
    >
      <AsanaUpsellModal
        title="Monitor connected projects in real time"
        description="Add projects to a portfolio to see progress at a glance. See which ones are on track and which ones need your attention."
        learnMoreUrl="https://asana.com/guide/help/premium/portfolios"
      />
    </AsanaLayout>
  );
}
