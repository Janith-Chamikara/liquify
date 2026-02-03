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
  Plus,
  Loader2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Info,
} from "lucide-react";
import { LiquidityPool } from "@/lib/types";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import { addLiquidity } from "@/lib/actions";
import { toast } from "sonner";

interface AddLiquidityDialogProps {
  pool: LiquidityPool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddLiquidityDialog({
  pool,
  open,
  onOpenChange,
  onSuccess,
}: AddLiquidityDialogProps) {
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState("");

  const { connected, depositLiquidity } = useAnchorProgram();

  // Calculate the current price ratio
  const priceRatio =
    pool && pool.tokenAReserve > 0
      ? pool.tokenBReserve / pool.tokenAReserve
      : 1;

  // When amount A changes, auto-calculate amount B to maintain ratio
  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    if (value && !isNaN(parseFloat(value))) {
      const calculatedB = parseFloat(value) * priceRatio;
      setAmountB(calculatedB.toFixed(6));
    } else {
      setAmountB("");
    }
  };

  // When amount B changes, auto-calculate amount A to maintain ratio
  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    if (value && !isNaN(parseFloat(value)) && priceRatio > 0) {
      const calculatedA = parseFloat(value) / priceRatio;
      setAmountA(calculatedA.toFixed(6));
    } else {
      setAmountA("");
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAmountA("");
      setAmountB("");
      setIsSuccess(false);
      setTxSignature("");
    }
  }, [open]);

  // Estimate LP tokens to receive
  const estimateLpTokens = () => {
    if (!pool || !amountA || isNaN(parseFloat(amountA))) return 0;

    const amountANum = parseFloat(amountA);

    // LP tokens = (deposit_amount_a / reserve_a) * total_lp_supply
    // Since we don't have total LP supply from backend, we estimate based on reserves
    // For simplicity, we'll show the proportional share
    if (pool.tokenAReserve > 0) {
      const sharePercent = (amountANum / pool.tokenAReserve) * 100;
      return sharePercent;
    }
    return 0;
  };

  const handleAddLiquidity = async () => {
    if (!pool || !connected) return;

    const amountANum = parseFloat(amountA);
    const amountBNum = parseFloat(amountB);

    if (
      isNaN(amountANum) ||
      isNaN(amountBNum) ||
      amountANum <= 0 ||
      amountBNum <= 0
    ) {
      toast.error("Please enter valid amounts");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Adding liquidity...");

    try {
      // Step 1: Deposit on-chain
      const result = await depositLiquidity(
        pool.tokenAMint,
        pool.tokenBMint,
        amountANum,
        amountBNum,
        pool.tokenA?.decimals || 6,
        pool.tokenB?.decimals || 6,
      );

      toast.loading("Updating database...", { id: toastId });

      // Step 2: Update database with new reserves
      const newReserveA = pool.tokenAReserve + amountANum;
      const newReserveB = pool.tokenBReserve + amountBNum;

      await addLiquidity({
        poolAddress: pool.poolAddress,
        amountA: amountANum,
        amountB: amountBNum,
        newReserveA,
        newReserveB,
        txSignature: result.signature,
      });

      setTxSignature(result.signature);
      setIsSuccess(true);
      toast.success("Liquidity added successfully!", { id: toastId });
      onSuccess?.();
    } catch (error: any) {
      console.error("Add liquidity error:", error);
      toast.error(error.message || "Failed to add liquidity", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pool) return null;

  const sharePercent = estimateLpTokens();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Add Liquidity
          </DialogTitle>
          <DialogDescription>
            Add more liquidity to the {pool.tokenA?.symbol}/
            {pool.tokenB?.symbol} pool
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          // Success State
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold">Liquidity Added!</h3>
            <p className="text-muted-foreground text-center text-sm">
              You have successfully added liquidity to the pool.
              <br />
              LP tokens have been minted to your wallet.
            </p>
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
                    1 {pool.tokenA?.symbol} = {priceRatio.toFixed(6)}{" "}
                    {pool.tokenB?.symbol}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                <Droplets className="h-3 w-3 mr-1" />
                Pool
              </Badge>
            </div>

            {/* Amount Inputs */}
            <div className="space-y-4">
              {/* Token A Input */}
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>{pool.tokenA?.symbol} Amount</span>
                  <span className="text-xs text-muted-foreground">
                    Pool: {pool.tokenAReserve.toLocaleString()}
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountA}
                    onChange={(e) => handleAmountAChange(e.target.value)}
                    className="pr-20"
                    disabled={isSubmitting}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={pool.tokenA?.imageUrl} />
                      <AvatarFallback className="text-[10px]">
                        {pool.tokenA?.symbol?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {pool.tokenA?.symbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plus Icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-muted p-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Token B Input */}
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>{pool.tokenB?.symbol} Amount</span>
                  <span className="text-xs text-muted-foreground">
                    Pool: {pool.tokenBReserve.toLocaleString()}
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountB}
                    onChange={(e) => handleAmountBChange(e.target.value)}
                    className="pr-20"
                    disabled={isSubmitting}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={pool.tokenB?.imageUrl} />
                      <AvatarFallback className="text-[10px]">
                        {pool.tokenB?.symbol?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {pool.tokenB?.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                You must deposit both tokens in the current pool ratio to
                receive LP tokens. The amounts are automatically balanced.
              </AlertDescription>
            </Alert>

            {/* Estimation */}
            {amountA && parseFloat(amountA) > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Pool share increase
                    </span>
                    <span className="font-medium text-green-600">
                      +{sharePercent.toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      You will receive
                    </span>
                    <span className="font-medium">
                      LP Tokens (proportional to deposit)
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Warning if not connected */}
            {!connected && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to add liquidity.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddLiquidity}
              disabled={
                !connected ||
                isSubmitting ||
                !amountA ||
                !amountB ||
                parseFloat(amountA) <= 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Liquidity...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Liquidity
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
