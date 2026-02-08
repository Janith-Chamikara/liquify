"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowDownUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowDown,
  Percent,
  TrendingDown,
} from "lucide-react";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import { LiquidityPool } from "@/lib/types";
import { recordSwap, recordTransaction } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";

type Props = {
  pool: LiquidityPool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwapSuccess?: () => void;
};

export function SwapDialog({ pool, open, onOpenChange, onSwapSuccess }: Props) {
  const { swap, calculateSwapOutput, connected } = useAnchorProgram();
  const { publicKey } = useWallet();

  const [amountIn, setAmountIn] = useState("");
  const [swapAToB, setSwapAToB] = useState(true);
  const [slippage, setSlippage] = useState(0.5); // 0.5% default slippage
  const [isSwapping, setIsSwapping] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setAmountIn("");
      setSwapAToB(true);
      setIsSwapping(false);
      setTxSignature(null);
    }
  }, [open]);

  // Calculate output amount
  const swapOutput = useMemo(() => {
    if (!pool || !amountIn || isNaN(parseFloat(amountIn))) {
      return { amountOut: 0, priceImpact: 0, fee: 0 };
    }

    const amount = parseFloat(amountIn);
    const reserveIn = swapAToB ? pool.tokenAReserve : pool.tokenBReserve;
    const reserveOut = swapAToB ? pool.tokenBReserve : pool.tokenAReserve;

    return calculateSwapOutput(reserveIn, reserveOut, amount);
  }, [pool, amountIn, swapAToB, calculateSwapOutput]);

  // Minimum amount out with slippage
  const minAmountOut = swapOutput.amountOut * (1 - slippage / 100);

  // Token info based on swap direction
  const inputToken = swapAToB ? pool?.tokenA : pool?.tokenB;
  const outputToken = swapAToB ? pool?.tokenB : pool?.tokenA;
  const inputMint = swapAToB ? pool?.tokenAMint : pool?.tokenBMint;
  const outputMint = swapAToB ? pool?.tokenBMint : pool?.tokenAMint;

  const handleSwapDirection = () => {
    setSwapAToB(!swapAToB);
    setAmountIn("");
  };

  const handleSwap = async () => {
    if (!pool || !amountIn || !connected) return;

    const amount = parseFloat(amountIn);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (swapOutput.amountOut <= 0) {
      toast.error("Insufficient liquidity");
      return;
    }

    setIsSwapping(true);

    try {
      const result = await swap(
        pool.tokenAMint,
        pool.tokenBMint,
        amount,
        minAmountOut,
        swapAToB,
        inputToken?.decimals || 6,
        outputToken?.decimals || 6,
      );

      setTxSignature(result.signature);

      // Calculate new reserves after swap
      const newReserveA = swapAToB
        ? pool.tokenAReserve + amount
        : pool.tokenAReserve - swapOutput.amountOut;
      const newReserveB = swapAToB
        ? pool.tokenBReserve - swapOutput.amountOut
        : pool.tokenBReserve + amount;

      // Record the swap in the backend
      await recordSwap({
        poolAddress: pool.poolAddress,
        tokenAReserve: newReserveA,
        tokenBReserve: newReserveB,
        txSignature: result.signature,
      });

      // Record the transaction for history
      if (publicKey) {
        await recordTransaction({
          txSignature: result.signature,
          txType: "swap",
          walletAddress: publicKey.toBase58(),
          poolAddress: pool.poolAddress,
          tokenInMint: inputMint,
          tokenOutMint: outputMint,
          tokenInSymbol: inputToken?.symbol,
          tokenOutSymbol: outputToken?.symbol,
          amountIn: amount,
          amountOut: swapOutput.amountOut,
        });
      }

      toast.success("Swap successful!", {
        description: `Swapped ${amount} ${inputToken?.symbol} for ${swapOutput.amountOut.toFixed(6)} ${outputToken?.symbol}`,
      });

      onSwapSuccess?.();
    } catch (error: any) {
      console.error("Swap error:", error);
      toast.error("Swap failed", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  if (!pool) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownUp className="h-5 w-5" />
            Swap Tokens
          </DialogTitle>
          <DialogDescription>
            Trade tokens using the {pool.tokenA?.symbol}/{pool.tokenB?.symbol}{" "}
            liquidity pool
          </DialogDescription>
        </DialogHeader>

        {txSignature ? (
          // Success state
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Swap Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your tokens have been swapped successfully
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
                  "_blank",
                )
              }
            >
              View Transaction
            </Button>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input Token */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">You pay</Label>
              <div className="flex gap-3 p-4 bg-muted/50 rounded-xl border">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={inputToken?.imageUrl} />
                    <AvatarFallback className="text-xs font-bold">
                      {inputToken?.symbol?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{inputToken?.symbol}</span>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="text-right text-xl font-mono border-0 bg-transparent focus-visible:ring-0 p-0"
                />
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background shadow-md hover:bg-muted"
                onClick={handleSwapDirection}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Output Token */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                You receive
              </Label>
              <div className="flex gap-3 p-4 bg-muted/50 rounded-xl border">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={outputToken?.imageUrl} />
                    <AvatarFallback className="text-xs font-bold">
                      {outputToken?.symbol?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{outputToken?.symbol}</span>
                </div>
                <div className="flex-1 text-right text-xl font-mono text-muted-foreground">
                  {swapOutput.amountOut > 0
                    ? swapOutput.amountOut.toFixed(6)
                    : "0.00"}
                </div>
              </div>
            </div>

            <Separator />

            {/* Swap Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Slippage
                </span>
                <div className="flex gap-1">
                  {[0.1, 0.5, 1.0].map((s) => (
                    <Button
                      key={s}
                      variant={slippage === s ? "secondary" : "ghost"}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSlippage(s)}
                    >
                      {s}%
                    </Button>
                  ))}
                </div>
              </div>

              {amountIn && swapOutput.amountOut > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-mono">
                      1 {inputToken?.symbol} ={" "}
                      {(swapOutput.amountOut / parseFloat(amountIn)).toFixed(6)}{" "}
                      {outputToken?.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee (0.3%)</span>
                    <span className="font-mono">
                      {swapOutput.fee.toFixed(6)} {inputToken?.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> Price Impact
                    </span>
                    <span
                      className={cn(
                        "font-mono",
                        swapOutput.priceImpact > 5
                          ? "text-red-500"
                          : swapOutput.priceImpact > 2
                            ? "text-yellow-500"
                            : "text-green-500",
                      )}
                    >
                      {swapOutput.priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min received</span>
                    <span className="font-mono">
                      {minAmountOut.toFixed(6)} {outputToken?.symbol}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* High Price Impact Warning */}
            {swapOutput.priceImpact > 5 && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  High price impact! Consider trading a smaller amount.
                </span>
              </div>
            )}

            {/* Swap Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={
                !connected ||
                !amountIn ||
                swapOutput.amountOut <= 0 ||
                isSwapping
              }
              onClick={handleSwap}
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Swapping...
                </>
              ) : !connected ? (
                "Connect Wallet"
              ) : !amountIn ? (
                "Enter an amount"
              ) : swapOutput.amountOut <= 0 ? (
                "Insufficient liquidity"
              ) : (
                `Swap ${inputToken?.symbol} for ${outputToken?.symbol}`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
