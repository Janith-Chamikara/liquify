"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PortfolioOverviewProps = {
  totalTokens: number;
  listedTokens: number;
};

export function PortfolioOverview({
  totalTokens,
  listedTokens,
}: PortfolioOverviewProps) {
  const listingProgress =
    totalTokens > 0 ? (listedTokens / totalTokens) * 100 : 0;

  const metrics = [
    {
      label: "Listing Progress",
      value: listingProgress,
      description: `${listedTokens} of ${totalTokens} tokens listed`,
    },
    {
      label: "Token Health",
      value: 85,
      description: "All tokens are performing well",
    },
    {
      label: "Community Growth",
      value: 72,
      description: "Growing steadily this month",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Portfolio Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="font-medium">{Math.round(metric.value)}%</span>
            </div>
            <Progress value={metric.value} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
