import { syncPoolReserves } from "@/lib/actions";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import { PoolWithOnChainData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ArrowRightLeft, Droplets, Minus, Plus, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export default function PoolCard({
  pool,
  onViewDetails,
  onSwap,
  onAddLiquidity,
  onWithdrawLiquidity,
}: {
  pool: PoolWithOnChainData;
  onViewDetails: (poolWithData: PoolWithOnChainData) => void;
  onSwap: (poolWithData: PoolWithOnChainData) => void;
  onAddLiquidity: (poolWithData: PoolWithOnChainData) => void;
  onWithdrawLiquidity: (poolWithData: PoolWithOnChainData) => void;
}) {
  const { getOnChainPoolData } = useAnchorProgram();

  const { data: onChainData, isLoading: isLoadingOnChain } = useQuery({
    queryKey: ["on-chain-pool", pool.tokenAMint, pool.tokenBMint],
    queryFn: () => getOnChainPoolData(pool.tokenAMint, pool.tokenBMint),
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const reserveA = onChainData?.reserveA ?? pool.tokenAReserve;
  const reserveB = onChainData?.reserveB ?? pool.tokenBReserve;
  const lpTotalSupply = onChainData?.lpTotalSupply ?? pool.lpTotalSupply;

  const price = reserveA > 0 ? (reserveB / reserveA).toFixed(6) : "0";

  const poolWithOnChainData: PoolWithOnChainData = {
    ...pool,
    tokenAReserve: reserveA,
    tokenBReserve: reserveB,
    lpTotalSupply: lpTotalSupply,
    onChainReserveA: onChainData?.reserveA,
    onChainReserveB: onChainData?.reserveB,
    onChainLpSupply: onChainData?.lpTotalSupply,
  };

  const handlePoolAction = async (
    action: (poolWithData: PoolWithOnChainData) => void,
  ) => {
    // Sync reserves to DB for chart data if we have on-chain data
    if (onChainData?.reserveA && onChainData?.reserveB) {
      syncPoolReserves({
        poolAddress: pool.poolAddress,
        tokenAReserve: onChainData.reserveA,
        tokenBReserve: onChainData.reserveB,
      }).catch((err) => console.error("Failed to sync pool data:", err));
    }
    action(poolWithOnChainData);
  };

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
            <span className="text-muted-foreground flex items-center gap-1">
              {pool.tokenA?.symbol} Reserve
              {isLoadingOnChain && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </span>
            <span className="font-mono font-medium">
              {reserveA.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              {pool.tokenB?.symbol} Reserve
              {isLoadingOnChain && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </span>
            <span className="font-mono font-medium">
              {reserveB.toLocaleString()}
            </span>
          </div>
          {lpTotalSupply > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">LP Supply</span>
              <span className="font-mono font-medium text-xs">
                {lpTotalSupply.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handlePoolAction(onViewDetails)}
          >
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => handlePoolAction(onAddLiquidity)}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1 text-destructive hover:text-destructive"
            onClick={() => handlePoolAction(onWithdrawLiquidity)}
          >
            <Minus className="h-3 w-3" />
            Remove
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1"
            onClick={() => handlePoolAction(onSwap)}
          >
            <ArrowRightLeft className="h-3 w-3" />
            Swap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
