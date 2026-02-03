"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllTokens, getAllPools } from "@/lib/actions";
import { ResponseStatus, LiquidityPool } from "@/lib/types";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SwapDialog } from "@/components/swap-dialog";
import { PoolDetailDialog } from "@/components/pool-detail-dialog";
import { AddLiquidityDialog } from "@/components/add-liquidity-dialog";

// Token type based on backend response
type Token = {
  id: string;
  mintAddress: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  supply: number;
  decimals: number;
  website?: string;
  twitter?: string;
  creatorWallet: string;
  createdAt: string;
};

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);
  const [swapPool, setSwapPool] = useState<LiquidityPool | null>(null);
  const [addLiquidityPool, setAddLiquidityPool] =
    useState<LiquidityPool | null>(null);

  // Fetch all tokens
  const { data: tokensData, isLoading: tokensLoading } = useQuery<
    ResponseStatus | undefined
  >({
    queryKey: ["all-tokens"],
    queryFn: getAllTokens,
  });

  // Fetch all pools
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

  // Filter based on search
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

      {/* Tabs for Tokens and Pools */}
      <Tabs defaultValue="pools" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pools" className="gap-2">
            <Droplets className="h-4 w-4" />
            Liquidity Pools ({filteredPools.length})
          </TabsTrigger>
          <TabsTrigger value="tokens" className="gap-2">
            <Coins className="h-4 w-4" />
            Tokens ({filteredTokens.length})
          </TabsTrigger>
        </TabsList>

        {/* Pools Tab */}
        <TabsContent value="pools" className="space-y-4">
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
                  onViewDetails={() => setSelectedPool(pool)}
                  onSwap={() => setSwapPool(pool)}
                  onAddLiquidity={() => setAddLiquidityPool(pool)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          {tokensLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                      <Skeleton className="h-4 w-3/4 mx-auto" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Coins className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  {searchQuery
                    ? "No tokens match your search query."
                    : "No tokens available yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTokens.map((token) => (
                <TokenCard
                  key={token.id}
                  token={token}
                  pools={pools}
                  onSwap={setSwapPool}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
    </div>
  );
}

// Pool Card Component
function PoolCard({
  pool,
  onViewDetails,
  onSwap,
  onAddLiquidity,
}: {
  pool: LiquidityPool;
  onViewDetails: () => void;
  onSwap: () => void;
  onAddLiquidity: () => void;
}) {
  const price =
    pool.tokenAReserve > 0
      ? (pool.tokenBReserve / pool.tokenAReserve).toFixed(6)
      : "0";

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-background">
                <AvatarImage src={pool.tokenA?.imageUrl} />
                <AvatarFallback className="bg-primary/20 text-sm font-bold">
                  {pool.tokenA?.symbol?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-background">
                <AvatarImage src={pool.tokenB?.imageUrl} />
                <AvatarFallback className="bg-secondary/20 text-sm font-bold">
                  {pool.tokenB?.symbol?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h3 className="font-semibold">
                {pool.tokenA?.symbol}/{pool.tokenB?.symbol}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pool.tokenA?.name} / {pool.tokenB?.name}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Droplets className="h-3 w-3" />
            LP
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono font-medium">
              1 {pool.tokenA?.symbol} = {price} {pool.tokenB?.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {pool.tokenA?.symbol} Reserve
            </span>
            <span className="font-mono font-medium">
              {pool.tokenAReserve.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {pool.tokenB?.symbol} Reserve
            </span>
            <span className="font-mono font-medium">
              {pool.tokenBReserve.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewDetails}
          >
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={onAddLiquidity}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
          <Button size="sm" className="flex-1 gap-1" onClick={onSwap}>
            <ArrowRightLeft className="h-3 w-3" />
            Swap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Token Card Component
function TokenCard({
  token,
  pools,
  onSwap,
}: {
  token: Token;
  pools: LiquidityPool[];
  onSwap: (pool: LiquidityPool) => void;
}) {
  // Find pools that include this token
  const tokenPools = pools.filter(
    (pool) =>
      pool.tokenAMint === token.mintAddress ||
      pool.tokenBMint === token.mintAddress,
  );

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <Avatar className="h-16 w-16 mb-3">
            <AvatarImage src={token.imageUrl} />
            <AvatarFallback className="text-xl font-bold bg-primary/20">
              {token.symbol?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{token.symbol}</h3>
          <p className="text-sm text-muted-foreground">{token.name}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Supply</span>
            <span className="font-mono font-medium">
              {token.supply.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Decimals</span>
            <span className="font-mono font-medium">{token.decimals}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pools</span>
            <span className="font-mono font-medium">{tokenPools.length}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/address/${token.mintAddress}?cluster=devnet`,
                "_blank",
              )
            }
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Explorer
          </Button>
          {tokenPools.length > 0 && (
            <Button
              size="sm"
              className="flex-1 gap-1"
              onClick={() => onSwap(tokenPools[0])}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Trade
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
