"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getTokens } from "@/lib/actions";
import { ResponseStatus, Token } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { TokenGrid } from "@/components/token-grid";
import { TokenDetailDialog } from "@/components/token-detail-dialog";

export default function TokenShowcase() {
  const { user } = useUser();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const { data, isLoading } = useQuery<ResponseStatus | undefined>({
    queryKey: ["tokens"],
    queryFn: () => getTokens(user?.publicMetadata.walletAddress as string),
    enabled: !!user?.publicMetadata.walletAddress,
  });

  const tokens = (data?.data as Token[]) ?? [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Launches</h2>
        <Badge variant="secondary">{tokens.length} Tokens</Badge>
      </div>

      <TokenGrid
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
