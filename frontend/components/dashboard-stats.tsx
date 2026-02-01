"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Wallet, Users } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
};

function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={`text-xs mt-1 ${
              changeType === "positive"
                ? "text-green-500"
                : changeType === "negative"
                  ? "text-red-500"
                  : "text-muted-foreground"
            }`}
          >
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type DashboardStatsProps = {
  totalTokens: number;
  listedTokens: number;
  totalSupply: number;
};

export function DashboardStats({
  totalTokens,
  listedTokens,
  totalSupply,
}: DashboardStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Tokens"
        value={totalTokens.toString()}
        change="+2 this week"
        changeType="positive"
        icon={Coins}
      />
      <StatCard
        title="Listed Tokens"
        value={listedTokens.toString()}
        change={`${((listedTokens / totalTokens) * 100 || 0).toFixed(0)}% of total`}
        changeType="neutral"
        icon={TrendingUp}
      />
      <StatCard
        title="Total Supply"
        value={formatNumber(totalSupply)}
        change="Across all tokens"
        changeType="neutral"
        icon={Wallet}
      />
      <StatCard
        title="Community"
        value="1.2K"
        change="+120 new holders"
        changeType="positive"
        icon={Users}
      />
    </div>
  );
}
