"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getTokens } from "@/lib/actions";
import { ResponseStatus, Token } from "@/lib/types";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardStats } from "@/components/dashboard-stats";
import { TokenTable } from "@/components/token-table";
import { RecentActivity } from "@/components/recent-activity";
import { TokenDetailDialog } from "@/components/token-detail-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user } = useUser();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const { data, isLoading } = useQuery<ResponseStatus | undefined>({
    queryKey: ["tokens"],
    queryFn: () => getTokens(user?.publicMetadata.walletAddress as string),
    enabled: !!user?.publicMetadata.walletAddress,
  });

  const tokens = (data?.data as Token[]) ?? [];
  const listedTokens = tokens.filter((t) => t.isListed).length;
  const totalSupply = tokens.reduce((acc, t) => acc + t.supply, 0);

  return (
    <div className="space-y-8 pb-10">
      <DashboardHeader />

      <DashboardStats
        totalTokens={tokens.length}
        listedTokens={listedTokens}
        totalSupply={totalSupply}
      />

      <TokenTable
        tokens={tokens}
        isLoading={isLoading}
        onSelect={setSelectedToken}
      />

      <TokenDetailDialog
        token={selectedToken}
        open={!!selectedToken}
        onOpenChange={(open) => !open && setSelectedToken(null)}
      />
    </div>
  );
}
