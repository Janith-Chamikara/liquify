"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getTokens, getLiquidityPools } from "@/lib/actions";
import {
  ResponseStatus,
  Token,
  LiquidityPool,
  PoolWithOnChainData,
} from "@/lib/types";
import { DashboardHeader } from "@/components/dashboard-header";
import { TokenTable } from "@/components/token-table";
import { TokenDetailDialog } from "@/components/token-detail-dialog";
import { PoolDetailDialog } from "@/components/pool-detail-dialog";
import { SwapDialog } from "@/components/swap-dialog";
import { AddLiquidityDialog } from "@/components/add-liquidity-dialog";
import { WithdrawLiquidityDialog } from "@/components/withdraw-liquidity-dialog";
import CreateLiquidityPoolDialog from "@/components/create-liquidity-pool-dialog";
import PoolCard from "@/components/pool-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Droplets, TrendingUp, History } from "lucide-react";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import { TransactionHistory } from "@/components/transaction-history";

export default function DashboardPage() {
  const { user } = useUser();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedPool, setSelectedPool] = useState<PoolWithOnChainData | null>(
    null,
  );
  const [swapPool, setSwapPool] = useState<PoolWithOnChainData | null>(null);
  const [addLiquidityPool, setAddLiquidityPool] =
    useState<PoolWithOnChainData | null>(null);
  const [withdrawLiquidityPool, setWithdrawLiquidityPool] =
    useState<PoolWithOnChainData | null>(null);

  const { getUserLpBalance, connected } = useAnchorProgram();

  const { data: userLpBalance = 0 } = useQuery({
    queryKey: [
      "user-lp-balance",
      withdrawLiquidityPool?.poolAddress,
      connected,
    ],
    queryFn: async () => {
      if (!withdrawLiquidityPool || !connected) return 0;
      return await getUserLpBalance(
        withdrawLiquidityPool.tokenAMint,
        withdrawLiquidityPool.tokenBMint,
        6,
      );
    },
    enabled: !!withdrawLiquidityPool && connected,
  });

  const { data: tokensData, isLoading: tokensLoading } = useQuery<
    ResponseStatus | undefined
  >({
    queryKey: ["tokens"],
    queryFn: () => getTokens(user?.publicMetadata.walletAddress as string),
    enabled: !!user?.publicMetadata.walletAddress,
  });

  const {
    data: poolsData,
    isLoading: poolsLoading,
    refetch: refetchPools,
  } = useQuery<ResponseStatus | undefined>({
    queryKey: ["liquidity-pools"],
    queryFn: () =>
      getLiquidityPools(user?.publicMetadata.walletAddress as string),
    enabled: !!user?.publicMetadata.walletAddress,
  });

  const tokens = (tokensData?.data as Token[]) ?? [];
  const pools = (poolsData?.data as LiquidityPool[]) ?? [];

  const listedTokens = tokens.filter((t) => t.isListed).length;
  const totalSupply = tokens.reduce((acc, t) => acc + t.supply, 0);

  return (
    <div className="space-y-8 pb-10">
      <DashboardHeader />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens.length}</div>
            <p className="text-xs text-muted-foreground">
              {listedTokens} listed for trading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSupply.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all your tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Pools</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pools.length}</div>
            <p className="text-xs text-muted-foreground">
              Active liquidity positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tokens and Pools */}
      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tokens" className="gap-2">
            <Coins className="h-4 w-4" />
            My Tokens ({tokens.length})
          </TabsTrigger>
          <TabsTrigger value="pools" className="gap-2">
            <Droplets className="h-4 w-4" />
            My Pools ({pools.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <TokenTable
            tokens={tokens}
            isLoading={tokensLoading}
            onSelect={setSelectedToken}
          />
        </TabsContent>

        {/* Pools Tab */}
        <TabsContent value="pools" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Liquidity Pools</h2>
            <CreateLiquidityPoolDialog onSuccess={() => refetchPools()} />
          </div>

          {poolsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pools.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Droplets className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Pools Yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  You haven&apos;t created any liquidity pools yet. Create your
                  first pool to start providing liquidity.
                </p>
                <CreateLiquidityPoolDialog onSuccess={() => refetchPools()} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  onViewDetails={setSelectedPool}
                  onSwap={setSwapPool}
                  onAddLiquidity={setAddLiquidityPool}
                  onWithdrawLiquidity={setWithdrawLiquidityPool}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <TransactionHistory
            walletAddress={user?.publicMetadata.walletAddress as string | null}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TokenDetailDialog
        token={selectedToken}
        open={!!selectedToken}
        onOpenChange={(open) => !open && setSelectedToken(null)}
      />

      <PoolDetailDialog
        pool={selectedPool}
        open={!!selectedPool}
        onOpenChange={(open) => !open && setSelectedPool(null)}
      />

      <SwapDialog
        pool={swapPool}
        open={!!swapPool}
        onOpenChange={(open) => !open && setSwapPool(null)}
        onSwapSuccess={() => refetchPools()}
      />

      <AddLiquidityDialog
        pool={addLiquidityPool}
        open={!!addLiquidityPool}
        onOpenChange={(open) => !open && setAddLiquidityPool(null)}
        onSuccess={() => refetchPools()}
      />

      <WithdrawLiquidityDialog
        pool={withdrawLiquidityPool}
        open={!!withdrawLiquidityPool}
        onOpenChange={(open) => !open && setWithdrawLiquidityPool(null)}
        onSuccess={() => refetchPools()}
        userLpBalance={userLpBalance}
      />
    </div>
  );
}
