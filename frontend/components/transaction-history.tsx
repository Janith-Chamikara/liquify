"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  Plus,
  Minus,
  Coins,
  Waves,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getTransactions } from "@/lib/actions";
import { Transaction, TransactionsResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type TransactionHistoryProps = {
  walletAddress: string | null;
};

const txTypeConfig = {
  swap: {
    icon: ArrowRightLeft,
    label: "Swap",
    color: "bg-blue-500/10 text-blue-500",
  },
  deposit: {
    icon: Plus,
    label: "Add Liquidity",
    color: "bg-green-500/10 text-green-500",
  },
  withdraw: {
    icon: Minus,
    label: "Remove Liquidity",
    color: "bg-orange-500/10 text-orange-500",
  },
  create_token: {
    icon: Coins,
    label: "Create Token",
    color: "bg-purple-500/10 text-purple-500",
  },
  create_pool: {
    icon: Waves,
    label: "Create Pool",
    color: "bg-cyan-500/10 text-cyan-500",
  },
};

function TransactionItem({ tx }: { tx: Transaction }) {
  const config = txTypeConfig[tx.txType];
  const Icon = config.icon;

  const getDescription = () => {
    switch (tx.txType) {
      case "swap":
        return `${tx.amountIn?.toLocaleString()} ${tx.tokenInSymbol} → ${tx.amountOut?.toLocaleString()} ${tx.tokenOutSymbol}`;
      case "deposit":
        return `Added ${tx.tokenAAmount?.toLocaleString()} + ${tx.tokenBAmount?.toLocaleString()} tokens`;
      case "withdraw":
        return `Removed ${tx.lpAmount?.toLocaleString()} LP tokens`;
      case "create_token":
        return `Created ${tx.tokenName} (${tx.tokenSymbol})`;
      case "create_pool":
        return "Created new liquidity pool";
      default:
        return "Transaction";
    }
  };

  const explorerUrl = `https://explorer.solana.com/tx/${tx.txSignature}?cluster=devnet`;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <div className={cn("p-2.5 rounded-full", config.color)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-medium">
            {config.label}
          </Badge>
          <Badge
            variant={tx.status === "confirmed" ? "default" : "secondary"}
            className="text-xs"
          >
            {tx.status}
          </Badge>
        </div>
        <p className="text-sm text-foreground truncate">{getDescription()}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
        </p>
      </div>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-muted rounded-md transition-colors"
        title="View on Solana Explorer"
      >
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </a>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function TransactionHistory({ walletAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchTransactions = async (txType?: string) => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await getTransactions(walletAddress, {
        txType: txType === "all" ? undefined : txType,
        limit: 50,
      });

      if (result?.status === "SUCCESS" && result.data) {
        const data = result.data as TransactionsResponse;
        setTransactions(data.transactions);
        setHasMore(data.hasMore);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(filter);
  }, [walletAddress, filter]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const handleRefresh = () => {
    fetchTransactions(filter);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            Transaction History
          </CardTitle>
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {total} total transactions
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="swap">Swaps</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdraw">Withdrawals</SelectItem>
              <SelectItem value="create_token">Tokens</SelectItem>
              <SelectItem value="create_pool">Pools</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="space-y-1 px-6 pb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <TransactionSkeleton key={i} />
              ))}
            </div>
          ) : !walletAddress ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Coins className="h-12 w-12 mb-4 opacity-50" />
              <p>Connect your wallet to view transactions</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">
                Your swaps, deposits, and withdrawals will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-6 pb-6">
              {transactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
              {hasMore && (
                <div className="pt-4 text-center">
                  <Button variant="outline" size="sm">
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
