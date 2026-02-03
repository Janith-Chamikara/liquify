"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getLiquidityPools } from "@/lib/actions";
import { ResponseStatus, LiquidityPool } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, ArrowRightLeft, Wallet, TrendingUp } from "lucide-react";
import CreateLiquidityPoolDialog from "@/components/create-liquidity-pool-dialog";
import { PoolDetailDialog } from "@/components/pool-detail-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LiquidityPoolsPage() {
  const { user } = useUser();
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);

  const { data, isLoading, refetch } = useQuery<ResponseStatus | undefined>({
    queryKey: ["liquidity-pools"],
    queryFn: () =>
      getLiquidityPools(user?.publicMetadata.walletAddress as string),
    enabled: !!user?.publicMetadata.walletAddress,
  });

  const pools = (data?.data as LiquidityPool[]) ?? [];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Liquidity Pools</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your AMM liquidity pools
          </p>
        </div>
        <CreateLiquidityPoolDialog onSuccess={() => refetch()} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pools</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pools.length}</div>
            <p className="text-xs text-muted-foreground">
              Active liquidity pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total LP Tokens
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pools
                .reduce((acc, p) => acc + p.lpTotalSupply, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all your pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Position</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pools.length}</div>
            <p className="text-xs text-muted-foreground">
              Pools you&apos;ve created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pool List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Pools</h2>

        {isLoading ? (
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
              <CreateLiquidityPoolDialog onSuccess={() => refetch()} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pools.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onClick={() => setSelectedPool(pool)}
              />
            ))}
          </div>
        )}
      </div>

      <PoolDetailDialog
        pool={selectedPool}
        open={!!selectedPool}
        onOpenChange={(open) => !open && setSelectedPool(null)}
      />
    </div>
  );
}

function PoolCard({
  pool,
  onClick,
}: {
  pool: LiquidityPool;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 group"
      onClick={onClick}
    >
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
              <h3 className="font-semibold group-hover:text-primary transition-colors">
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

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Token A Reserve</span>
            <span className="font-mono font-medium">
              {pool.tokenAReserve.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Token B Reserve</span>
            <span className="font-mono font-medium">
              {pool.tokenBReserve.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LP Supply</span>
            <span className="font-mono font-medium">
              {pool.lpTotalSupply.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate font-mono max-w-[180px]">
            {pool.poolAddress}
          </p>
          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            View Details →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
