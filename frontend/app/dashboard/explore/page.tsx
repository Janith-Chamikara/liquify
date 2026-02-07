"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllTokens, getAllPools, syncPoolReserves } from "@/lib/actions";
import {
  ResponseStatus,
  LiquidityPool,
  PoolWithOnChainData,
  Token,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Droplets,
  Coins,
  ArrowRightLeft,
  TrendingUp,
  ExternalLink,
  Search,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SwapDialog } from "@/components/swap-dialog";
import { PoolDetailDialog } from "@/components/pool-detail-dialog";
import { AddLiquidityDialog } from "@/components/add-liquidity-dialog";
import { WithdrawLiquidityDialog } from "@/components/withdraw-liquidity-dialog";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import PoolCard from "@/components/pool-card";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPool, setSelectedPool] = useState<PoolWithOnChainData | null>(
    null,
  );
  const [swapPool, setSwapPool] = useState<PoolWithOnChainData | null>(null);
  const [addLiquidityPool, setAddLiquidityPool] =
    useState<PoolWithOnChainData | null>(null);
  const [withdrawLiquidityPool, setWithdrawLiquidityPool] =
    useState<PoolWithOnChainData | null>(null);

  const { getUserLpBalance, getOnChainPoolData, connected } =
    useAnchorProgram();

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
    queryKey: ["all-tokens"],
    queryFn: getAllTokens,
  });

  const {
    data: poolsData,
    isLoading: poolsLoading,
    refetch: refetchPools,
  } = useQuery<ResponseStatus | undefined>({
    queryKey: ["all-pools"],
    queryFn: getAllPools,
  });

  const tokens = (tokensData?.data as Token[]) ?? [];
  const pools = (poolsData?.data as LiquidityPool[]) ?? [];

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredPools = pools.filter(
    (pool) =>
      pool.tokenA?.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.tokenB?.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.tokenA?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.tokenB?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
          <p className="text-muted-foreground mt-1">
            Discover tokens and liquidity pools to trade
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tokens or pools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for trading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Liquidity Pools
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pools.length}</div>
            <p className="text-xs text-muted-foreground">
              Active trading pairs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trading Fee</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.3%</div>
            <p className="text-xs text-muted-foreground">
              Standard AMM fee on swaps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pools Tab */}

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
      ) : filteredPools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Droplets className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Pools Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? "No pools match your search query."
                : "No liquidity pools available yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onViewDetails={(p) => setSelectedPool(p)}
              onSwap={(p) => setSwapPool(p)}
              onAddLiquidity={(p) => setAddLiquidityPool(p)}
              onWithdrawLiquidity={(p) => setWithdrawLiquidityPool(p)}
            />
          ))}
        </div>
      )}

      {/* Pool Detail Dialog */}
      <PoolDetailDialog
        pool={selectedPool}
        open={!!selectedPool}
        onOpenChange={(open) => !open && setSelectedPool(null)}
      />

      {/* Swap Dialog */}
      <SwapDialog
        pool={swapPool}
        open={!!swapPool}
        onOpenChange={(open) => !open && setSwapPool(null)}
        onSwapSuccess={() => refetchPools()}
      />

      {/* Add Liquidity Dialog */}
      <AddLiquidityDialog
        pool={addLiquidityPool}
        open={!!addLiquidityPool}
        onOpenChange={(open) => !open && setAddLiquidityPool(null)}
        onSuccess={() => refetchPools()}
      />

      {/* Withdraw Liquidity Dialog */}
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
