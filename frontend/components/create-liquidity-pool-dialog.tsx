"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Droplets, ArrowRightLeft, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createLiquidityPoolSchema,
  type CreateLiquidityPoolFormValues,
} from "@/lib/schema";
import { toast } from "sonner";
import { createLiquidityPool, getTokens } from "@/lib/actions";
import { ResponseStatus, Token } from "@/lib/types";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";

interface CreateLiquidityPoolDialogProps {
  onSuccess?: () => void;
}

export default function CreateLiquidityPoolDialog({
  onSuccess,
}: CreateLiquidityPoolDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Use the Anchor program hook for smart contract interactions
  const {
    connected,
    walletPublicKey,
    initializePool,
    depositLiquidity,
    poolExists,
  } = useAnchorProgram();

  // Fetch available tokens
  const { data: tokensData, isLoading: isLoadingTokens } = useQuery<
    ResponseStatus | undefined
  >({
    queryKey: ["tokens"],
    queryFn: () => getTokens(user?.publicMetadata.walletAddress as string),
    enabled: !!user?.publicMetadata.walletAddress && open,
  });

  const tokens = (tokensData?.data as Token[]) ?? [];

  const form = useForm({
    resolver: zodResolver(createLiquidityPoolSchema),
    defaultValues: {
      tokenAMint: "",
      tokenBMint: "",
      initialTokenAAmount: 0,
      initialTokenBAmount: 0,
    },
  });

  const onSubmit = async (data: CreateLiquidityPoolFormValues) => {
    if (!connected || !walletPublicKey) {
      toast.error("Wallet not connected. Please connect your wallet.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Initializing liquidity pool...");

    try {
      // Get token info for decimals
      const tokenA = tokens.find((t) => t.mintAddress === data.tokenAMint);
      const tokenB = tokens.find((t) => t.mintAddress === data.tokenBMint);

      if (!tokenA || !tokenB) {
        throw new Error("Could not find token information");
      }

      // Check if pool already exists on-chain
      const exists = await poolExists(data.tokenAMint, data.tokenBMint);
      if (exists) {
        throw new Error(
          "A liquidity pool already exists for this token pair on-chain",
        );
      }

      toast.message("Creating pool accounts on Solana...", { id: toastId });

      // Step 1: Initialize the pool on the smart contract (with token symbols for LP metadata)
      const initResult = await initializePool(
        data.tokenAMint,
        data.tokenBMint,
        tokenA.symbol,
        tokenB.symbol,
      );

      toast.message("Pool created! Depositing initial liquidity...", {
        id: toastId,
      });

      // Step 2: Deposit initial liquidity
      await depositLiquidity(
        data.tokenAMint,
        data.tokenBMint,
        data.initialTokenAAmount,
        data.initialTokenBAmount,
        tokenA.decimals,
        tokenB.decimals,
      );

      toast.message("Saving pool to database...", { id: toastId });

      // Step 3: Save to backend
      const backendPayload = {
        poolAddress: initResult.poolAddress,
        tokenAMint: data.tokenAMint,
        tokenBMint: data.tokenBMint,
        lpMintAddress: initResult.lpMintAddress,
        vaultAAddress: initResult.vaultAAddress,
        vaultBAddress: initResult.vaultBAddress,
        initialTokenAAmount: data.initialTokenAAmount,
        initialTokenBAmount: data.initialTokenBAmount,
        creatorWallet: walletPublicKey,
        txSignature: initResult.signature,
      };

      const response = await createLiquidityPool(backendPayload);

      if ((response as ResponseStatus)?.status === "SUCCESS") {
        toast.success("Liquidity pool created successfully!", {
          id: toastId,
          description: `Pool is now live on Solana. TX: ${initResult.signature.slice(0, 8)}...`,
        });
        form.reset();
        setOpen(false);

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["pools"] });
        queryClient.invalidateQueries({ queryKey: ["tokens"] });

        onSuccess?.();
      } else {
        // Pool was created on-chain but failed to save to backend
        toast.warning("Pool created on Solana but failed to save to database", {
          id: toastId,
          description: `TX: ${initResult.signature}. Please contact support.`,
        });
      }
    } catch (error) {
      console.error("Pool creation failed:", error);
      toast.error("Failed to create liquidity pool", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Check console for details.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="font-semibold shadow-md">
          <Droplets className="mr-2 h-4 w-4" />
          Create Liquidity Pool
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Create Liquidity Pool
          </DialogTitle>
          <DialogDescription>
            Create a new AMM liquidity pool for two tokens. This will deploy a
            new pool with vaults for both tokens.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {!connected && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Please connect your wallet to create a liquidity pool.
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Token Pair
                </h3>

                {isLoadingTokens ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No tokens found. Create some tokens first to create a
                      liquidity pool.
                    </p>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="tokenAMint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token A</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Token A" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tokens
                                .filter(
                                  (t) =>
                                    t.mintAddress !== form.watch("tokenBMint"),
                                )
                                .map((token) => (
                                  <SelectItem
                                    key={token.mintAddress}
                                    value={token.mintAddress}
                                  >
                                    <div className="flex items-center gap-2">
                                      {token.imageUrl ? (
                                        <img
                                          src={token.imageUrl}
                                          alt={token.symbol}
                                          className="w-5 h-5 rounded-full"
                                        />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                          <span className="text-[10px] font-bold">
                                            {token.symbol?.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                      <span className="font-medium">
                                        {token.symbol}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {token.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the first token for the pair
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-center">
                      <div className="p-2 rounded-full bg-muted">
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="tokenBMint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token B</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Token B" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tokens
                                .filter(
                                  (t) =>
                                    t.mintAddress !== form.watch("tokenAMint"),
                                )
                                .map((token) => (
                                  <SelectItem
                                    key={token.mintAddress}
                                    value={token.mintAddress}
                                  >
                                    <div className="flex items-center gap-2">
                                      {token.imageUrl ? (
                                        <img
                                          src={token.imageUrl}
                                          alt={token.symbol}
                                          className="w-5 h-5 rounded-full"
                                        />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                          <span className="text-[10px] font-bold">
                                            {token.symbol?.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                      <span className="font-medium">
                                        {token.symbol}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {token.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the second token for the pair
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Initial Liquidity
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="initialTokenAAmount"
                    render={({ field }) => {
                      const selectedTokenA = tokens.find(
                        (t) => t.mintAddress === form.watch("tokenAMint"),
                      );
                      return (
                        <FormItem>
                          <FormLabel>
                            {selectedTokenA
                              ? `${selectedTokenA.symbol} Amount`
                              : "Token A Amount"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="initialTokenBAmount"
                    render={({ field }) => {
                      const selectedTokenB = tokens.find(
                        (t) => t.mintAddress === form.watch("tokenBMint"),
                      );
                      return (
                        <FormItem>
                          <FormLabel>
                            {selectedTokenB
                              ? `${selectedTokenB.symbol} Amount`
                              : "Token B Amount"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  The initial token amounts determine the starting price ratio
                  of the pool. Make sure you have sufficient balance of both
                  tokens.
                </p>
              </div>

              <Separator />

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="text-sm font-medium">Pool Details</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Pool PDAs and LP mint will be created automatically</li>
                  <li>• Vaults for both tokens will be initialized</li>
                  <li>• LP tokens will be minted based on initial liquidity</li>
                  <li>• You will be the initial liquidity provider</li>
                  <li>• 0.3% swap fee will be applied to all trades</li>
                </ul>
              </div>

              <div className="pt-2 sticky bottom-0 bg-background pb-2">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || tokens.length < 2 || !connected}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Pool...
                    </>
                  ) : !connected ? (
                    <>
                      <Droplets className="mr-2 h-4 w-4" />
                      Connect Wallet First
                    </>
                  ) : (
                    <>
                      <Droplets className="mr-2 h-4 w-4" />
                      Create Pool
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
