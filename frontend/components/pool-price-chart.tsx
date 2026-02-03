"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPriceHistory } from "@/lib/actions";
import { ResponseStatus } from "@/lib/types";

type TimeRange = "1H" | "24H" | "7D" | "30D" | "ALL";

type Props = {
  poolAddress: string;
  tokenASymbol: string;
  tokenBSymbol: string;
  currentPrice: number;
};

type PriceDataPoint = {
  time: string;
  price: number;
  timestamp: number;
};

type PriceHistoryResponse = {
  poolAddress: string;
  timeRange: TimeRange;
  priceHistory: Array<{
    price: number;
    tokenAReserve: number;
    tokenBReserve: number;
    txType: string;
    timestamp: string;
  }>;
  priceChange: {
    value: number;
    percent: number;
  };
  currentPrice: number;
};

function formatTimestamp(timestamp: string, timeRange: TimeRange): string {
  const date = new Date(timestamp);

  switch (timeRange) {
    case "1H":
    case "24H":
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "7D":
    case "30D":
    case "ALL":
    default:
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

export function PoolPriceChart({
  poolAddress,
  tokenASymbol,
  tokenBSymbol,
  currentPrice,
}: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24H");

  const { data: priceHistoryResponse, isLoading } = useQuery<
    ResponseStatus | undefined
  >({
    queryKey: ["price-history", poolAddress, timeRange],
    queryFn: () => getPriceHistory(poolAddress, timeRange),
    enabled: !!poolAddress,
    staleTime: 30 * 1000,
  });

  // Process the data
  const { chartData, priceChange, hasRealData } = useMemo(() => {
    const responseData = priceHistoryResponse?.data as
      | PriceHistoryResponse
      | undefined;

    // If we have real data from the backend
    if (responseData?.priceHistory && responseData.priceHistory.length > 0) {
      const chartData: PriceDataPoint[] = responseData.priceHistory.map(
        (point) => ({
          time: formatTimestamp(point.timestamp, timeRange),
          price: point.price,
          timestamp: new Date(point.timestamp).getTime(),
        }),
      );

      return {
        chartData,
        priceChange: responseData.priceChange,
        hasRealData: true,
      };
    }

    // No data available
    return {
      chartData: [],
      priceChange: { value: 0, percent: 0 },
      hasRealData: false,
    };
  }, [priceHistoryResponse, timeRange]);

  const isPositive = priceChange.percent >= 0;

  const minPrice =
    chartData.length > 0 ? Math.min(...chartData.map((d) => d.price)) : 0;
  const maxPrice =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.price))
      : currentPrice;
  const priceBuffer = (maxPrice - minPrice) * 0.1 || currentPrice * 0.1;

  const timeRanges: TimeRange[] = ["1H", "24H", "7D", "30D", "ALL"];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-48 mt-2" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-[200px] w-full" />
          <div className="flex justify-center gap-1 mt-4">
            {timeRanges.map((range) => (
              <Skeleton key={range} className="h-7 w-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasRealData || chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              {tokenASymbol} Price
            </CardTitle>
          </div>
          <p className="text-2xl font-bold font-mono">
            {currentPrice.toFixed(6)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {tokenBSymbol}
            </span>
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[200px] w-full flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">No price history available yet</p>
            <p className="text-xs mt-1">Chart will appear after swaps occur</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              {tokenASymbol} Price
            </CardTitle>
          </div>
          <Badge
            variant={isPositive ? "default" : "destructive"}
            className={cn(
              "gap-1",
              isPositive
                ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                : "bg-red-500/10 text-red-600 hover:bg-red-500/20",
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}
            {priceChange.percent.toFixed(2)}%
          </Badge>
        </div>
        <p className="text-2xl font-bold font-mono">
          {currentPrice.toFixed(6)}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {tokenBSymbol}
          </span>
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#22c55e" : "#ef4444"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#22c55e" : "#ef4444"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickMargin={8}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[minPrice - priceBuffer, maxPrice + priceBuffer]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(value) => value.toFixed(4)}
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PriceDataPoint;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="text-xs mb-1">{data.time}</p>
                        <p className="font-mono font-semibold">
                          {data.price.toFixed(6)} {tokenBSymbol}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center gap-1 mt-4">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Price in {tokenBSymbol} (stablecoin)
        </p>
      </CardContent>
    </Card>
  );
}
