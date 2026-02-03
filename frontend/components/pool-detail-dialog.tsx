"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Droplets,
  Copy,
  ExternalLink,
  Check,
  ArrowRightLeft,
  Coins,
  Wallet,
  TrendingUp,
  ImageIcon,
} from "lucide-react";
import { LiquidityPool } from "@/lib/types";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PoolPriceChart } from "@/components/pool-price-chart";

type Props = {
  pool: LiquidityPool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PoolDetailDialog({ pool, open, onOpenChange }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!pool) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const price =
    pool.tokenBReserve > 0
      ? (pool.tokenAReserve / pool.tokenBReserve).toFixed(6)
      : "N/A";

  const inversePrice =
    pool.tokenAReserve > 0
      ? (pool.tokenBReserve / pool.tokenAReserve).toFixed(6)
      : "N/A";

  // Current price of Token A in terms of Token B (stablecoin)
  const currentPriceNumeric =
    pool.tokenAReserve > 0 ? pool.tokenBReserve / pool.tokenAReserve : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-5xl p-0 overflow-hidden gap-0 border-none ring-0 max-h-[90vh]">
        <ScrollArea className="max-h-[90vh]">
          <div className="grid md:grid-cols-2">
            {/* LEFT SIDE: Token Pair Display + Price Chart */}
            <div className="bg-muted/30 flex flex-col p-6 md:p-8 border-b md:border-b-0 md:border-r relative">
              {/* Background blur effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

              <div className="relative flex flex-col items-center gap-6">
                {/* Token Pair Images */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-xl">
                      <AvatarImage
                        src={pool.tokenA?.imageUrl}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl md:text-3xl font-bold bg-primary/20">
                        {pool.tokenA?.symbol?.charAt(0) || (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs">
                      {pool.tokenA?.symbol}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-full bg-muted border shadow-sm">
                    <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="relative">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-xl">
                      <AvatarImage
                        src={pool.tokenB?.imageUrl}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl md:text-3xl font-bold bg-secondary/20">
                        {pool.tokenB?.symbol?.charAt(0) || (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      variant="secondary"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs"
                    >
                      {pool.tokenB?.symbol}
                    </Badge>
                  </div>
                </div>

                {/* Pool Name */}
                <div className="text-center mt-4">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {pool.tokenA?.symbol} / {pool.tokenB?.symbol}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {pool.tokenA?.name} / {pool.tokenB?.name}
                  </p>
                </div>

                {/* Price Display */}
                <div className="grid grid-cols-2 gap-4 w-full mt-2">
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 text-center border">
                    <p className="text-xs text-muted-foreground mb-1">
                      1 {pool.tokenA?.symbol} =
                    </p>
                    <p className="font-mono font-semibold">
                      {inversePrice} {pool.tokenB?.symbol}
                    </p>
                  </div>
                  <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 text-center border">
                    <p className="text-xs text-muted-foreground mb-1">
                      1 {pool.tokenB?.symbol} =
                    </p>
                    <p className="font-mono font-semibold">
                      {price} {pool.tokenA?.symbol}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="relative mt-6">
                <PoolPriceChart
                  poolAddress={pool.poolAddress}
                  tokenASymbol={pool.tokenA?.symbol || "Token A"}
                  tokenBSymbol={pool.tokenB?.symbol || "Token B"}
                  currentPrice={currentPriceNumeric}
                />
              </div>
            </div>

            {/* RIGHT SIDE: Details */}
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold">
                    Pool Details
                  </DialogTitle>
                  <Badge variant="secondary" className="gap-1">
                    <Droplets className="h-3 w-3" />
                    AMM Pool
                  </Badge>
                </div>
                <DialogDescription>
                  Liquidity pool on Solana Devnet
                </DialogDescription>
              </DialogHeader>

              {/* Reserves */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                  Pool Reserves
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={pool.tokenA?.imageUrl} />
                        <AvatarFallback className="bg-primary/20 text-sm font-bold">
                          {pool.tokenA?.symbol?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{pool.tokenA?.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {pool.tokenA?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">
                        {pool.tokenAReserve.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Reserve</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-card border rounded-xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={pool.tokenB?.imageUrl} />
                        <AvatarFallback className="bg-secondary/20 text-sm font-bold">
                          {pool.tokenB?.symbol?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{pool.tokenB?.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {pool.tokenB?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">
                        {pool.tokenBReserve.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Reserve</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LP Token Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                  LP Token
                </h4>
                <div className="p-4 bg-card border rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      <span className="font-medium">Total Supply</span>
                    </div>
                    <span className="font-mono font-semibold">
                      {pool.lpTotalSupply.toLocaleString()}
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      LP Mint Address
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 p-2 bg-muted/50 rounded text-xs font-mono truncate">
                        {pool.lpMintAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          copyToClipboard(pool.lpMintAddress, "lp")
                        }
                      >
                        {copiedField === "lp" ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Addresses */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                  Contract Addresses
                </h4>

                {/* Pool Address */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Pool Address</p>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 bg-muted/50 border rounded text-xs font-mono truncate">
                      {pool.poolAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(pool.poolAddress, "pool")}
                    >
                      {copiedField === "pool" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Token Mints */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {pool.tokenA?.symbol} Mint
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 p-2 bg-muted/50 border rounded text-xs font-mono truncate">
                        {pool.tokenAMint}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          copyToClipboard(pool.tokenAMint, "tokenA")
                        }
                      >
                        {copiedField === "tokenA" ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {pool.tokenB?.symbol} Mint
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 p-2 bg-muted/50 border rounded text-xs font-mono truncate">
                        {pool.tokenBMint}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          copyToClipboard(pool.tokenBMint, "tokenB")
                        }
                      >
                        {copiedField === "tokenB" ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://explorer.solana.com/address/${pool.poolAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Pool on Explorer
                  </a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://explorer.solana.com/address/${pool.lpMintAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    View LP Token on Explorer
                  </a>
                </Button>
              </div>

              {/* Creator Info */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                Created by{" "}
                <span className="font-mono">
                  {pool.creatorWallet.slice(0, 4)}...
                  {pool.creatorWallet.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
