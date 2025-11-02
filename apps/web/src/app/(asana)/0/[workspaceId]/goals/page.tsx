"use client";

import { AsanaLayout } from "@/components/asana-layout";
import { AsanaUpsellModal } from "@/components/asana-upsell-modal";

type PageParams = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default function GoalsPage({ params }: PageParams) {
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
      title="Goals"
    >
      <AsanaUpsellModal
        title="Track progress on key initiatives"
        description="Set goals for your company, your team, or yourself. Connect each goal to the work that supports it so you can track progress automatically."
        learnMoreUrl="https://asana.com/guide/help/premium/goals"
      />
    </AsanaLayout>
  );
}
