"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Droplets,
  Minus,
  Loader2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Info,
  Wallet,
} from "lucide-react";
import { LiquidityPool } from "@/lib/types";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import { withdrawLiquidity, recordTransaction } from "@/lib/actions";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";

interface WithdrawLiquidityDialogProps {
  pool: LiquidityPool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userLpBalance?: number;
}

export function WithdrawLiquidityDialog({
  pool,
  open,
  onOpenChange,
  onSuccess,
  userLpBalance = 0,
}: WithdrawLiquidityDialogProps) {
  const [lpAmount, setLpAmount] = useState("");
  const [percentage, setPercentage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [withdrawResult, setWithdrawResult] = useState<{
    amountA: number;
    amountB: number;
  } | null>(null);

  const { connected, withdrawLiquidity: withdrawLiquidityOnChain } =
    useAnchorProgram();
  const { publicKey } = useWallet();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setLpAmount("");
      setPercentage(0);
      setIsSuccess(false);
      setTxSignature("");
      setWithdrawResult(null);
    }
  }, [open]);

  // Calculate expected token returns
  const calculateExpectedReturns = () => {
    if (!pool || !lpAmount || isNaN(parseFloat(lpAmount))) {
      return { amountA: 0, amountB: 0 };
    }
    console.log(pool);
    console.log(lpAmount);
    const lpAmountNum = parseFloat(lpAmount);
    const totalLpSupply = pool.lpTotalSupply || 1;

    // Formula: amount = (lp_burned / total_lp) * reserve
    const amountA = (lpAmountNum / userLpBalance) * pool.tokenAReserve;
    const amountB = (lpAmountNum / userLpBalance) * pool.tokenBReserve;

    return { amountA, amountB };
  };

  // Handle percentage slider change
  const handlePercentageChange = (value: number[]) => {
    const pct = value[0];
    setPercentage(pct);
    if (userLpBalance > 0) {
      const calculatedAmount = (pct / 100) * userLpBalance;
      setLpAmount(calculatedAmount.toFixed(6));
    }
  };

  // Handle direct input change
  const handleLpAmountChange = (value: string) => {
    setLpAmount(value);
    if (value && !isNaN(parseFloat(value)) && userLpBalance > 0) {
      const pct = (parseFloat(value) / userLpBalance) * 100;
      setPercentage(Math.min(100, Math.max(0, pct)));
    } else {
      setPercentage(0);
    }
  };

  // Quick percentage buttons
  const setQuickPercentage = (pct: number) => {
    setPercentage(pct);
    if (userLpBalance > 0) {
      const calculatedAmount = (pct / 100) * userLpBalance;
      setLpAmount(calculatedAmount.toFixed(6));
    }
  };

  const handleWithdrawLiquidity = async () => {
    if (!pool || !connected) return;

    const lpAmountNum = parseFloat(lpAmount);

    if (isNaN(lpAmountNum) || lpAmountNum <= 0) {
      toast.error("Please enter a valid LP token amount");
      return;
    }

    if (lpAmountNum > userLpBalance) {
      toast.error("Insufficient LP token balance");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Withdrawing liquidity...");

    try {
      // Step 1: Withdraw on-chain
      const result = await withdrawLiquidityOnChain(
        pool.tokenAMint,
        pool.tokenBMint,
        lpAmountNum,
        6, // LP decimals
        pool.tokenAReserve,
        pool.tokenBReserve,
        pool.lpTotalSupply || 0,
      );

      toast.loading("Updating database...", { id: toastId });
      console.log(result);
      // Step 2: Update database with new reserves
      const newReserveA = pool.tokenAReserve - result.amountA;
      const newReserveB = pool.tokenBReserve - result.amountB;

      await withdrawLiquidity({
        poolAddress: pool.poolAddress,
        lpAmount: lpAmountNum,
        amountA: result.amountA,
        amountB: result.amountB,
        newReserveA: Math.max(0, newReserveA),
        newReserveB: Math.max(0, newReserveB),
        txSignature: result.signature,
      });

      // Record transaction for history
      if (publicKey) {
        await recordTransaction({
          txSignature: result.signature,
          txType: "withdraw",
          walletAddress: publicKey.toBase58(),
          poolAddress: pool.poolAddress,
          tokenAAmount: result.amountA,
          tokenBAmount: result.amountB,
          lpAmount: lpAmountNum,
        });
      }

      setTxSignature(result.signature);
      setWithdrawResult({
        amountA: result.amountA,
        amountB: result.amountB,
      });
      setIsSuccess(true);
      toast.success("Liquidity withdrawn successfully!", { id: toastId });
      onSuccess?.();
    } catch (error: any) {
      console.error("Withdraw liquidity error:", error);
      toast.error(error.message || "Failed to withdraw liquidity", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pool) return null;

  const expectedReturns = calculateExpectedReturns();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-destructive" />
            Withdraw Liquidity
          </DialogTitle>
          <DialogDescription>
            Remove your liquidity from the {pool.tokenA?.symbol}/
            {pool.tokenB?.symbol} pool
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          // Success State
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">Liquidity Withdrawn!</h3>
            <p className="text-muted-foreground text-center text-sm">
              You have successfully withdrawn your liquidity.
            </p>

            {withdrawResult && (
              <div className="w-full space-y-2 p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-center mb-3">
                  You received:
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={pool.tokenA?.imageUrl} />
                      <AvatarFallback className="text-[10px]">
                        {pool.tokenA?.symbol?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{pool.tokenA?.symbol}</span>
                  </div>
                  <span className="font-medium">
                    {withdrawResult.amountA.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={pool.tokenB?.imageUrl} />
                      <AvatarFallback className="text-[10px]">
                        {pool.tokenB?.symbol?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{pool.tokenB?.symbol}</span>
                  </div>
                  <span className="font-medium">
                    {withdrawResult.amountB.toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Transaction
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Form State
          <div className="space-y-6 py-4">
            {/* Pool Info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={pool.tokenA?.imageUrl} />
                    <AvatarFallback className="text-xs">
                      {pool.tokenA?.symbol?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={pool.tokenB?.imageUrl} />
                    <AvatarFallback className="text-xs">
                      {pool.tokenB?.symbol?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="font-medium">
                    {pool.tokenA?.symbol}/{pool.tokenB?.symbol}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reserves: {pool.tokenAReserve.toLocaleString()} /{" "}
                    {pool.tokenBReserve.toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                <Droplets className="h-3 w-3 mr-1" />
                Pool
              </Badge>
            </div>

            {/* Your LP Balance */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Your LP Balance
                  </span>
                </div>
                <span className="font-medium">
                  {userLpBalance.toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  LP
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>LP Token Amount</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setQuickPercentage(100)}
                  >
                    Max
                  </Button>
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={lpAmount}
                  onChange={(e) => handleLpAmountChange(e.target.value)}
                  disabled={isSubmitting || userLpBalance <= 0}
                />
              </div>

              {/* Percentage Buttons */}
              <div className="flex justify-between gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <Button
                    key={pct}
                    variant={percentage === pct ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setQuickPercentage(pct)}
                    disabled={isSubmitting || userLpBalance <= 0}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Expected Returns */}
            {lpAmount && parseFloat(lpAmount) > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">You will receive</p>
                  <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={pool.tokenA?.imageUrl} />
                          <AvatarFallback className="text-[10px]">
                            {pool.tokenA?.symbol?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{pool.tokenA?.symbol}</span>
                      </div>
                      <span className="font-medium text-green-600">
                        ~
                        {expectedReturns.amountA.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={pool.tokenB?.imageUrl} />
                          <AvatarFallback className="text-[10px]">
                            {pool.tokenB?.symbol?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{pool.tokenB?.symbol}</span>
                      </div>
                      <span className="font-medium text-green-600">
                        ~
                        {expectedReturns.amountB.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Withdrawing liquidity will burn your LP tokens and return the
                proportional share of both tokens from the pool.
              </AlertDescription>
            </Alert>

            {/* Warning if no LP balance */}
            {userLpBalance <= 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You don&apos;t have any LP tokens for this pool.
                </AlertDescription>
              </Alert>
            )}

            {/* Warning if not connected */}
            {!connected && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to withdraw liquidity.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              variant="destructive"
              onClick={handleWithdrawLiquidity}
              disabled={
                !connected ||
                isSubmitting ||
                !lpAmount ||
                parseFloat(lpAmount) <= 0 ||
                userLpBalance <= 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 mr-2" />
                  Withdraw Liquidity
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
