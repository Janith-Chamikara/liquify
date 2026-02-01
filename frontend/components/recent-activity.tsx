"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Token } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

type RecentActivityProps = {
  tokens: Token[];
};

export function RecentActivity({ tokens }: RecentActivityProps) {
  const recentTokens = tokens.slice(0, 5);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-75">
          {recentTokens.length === 0 ? (
            <div className="flex items-center justify-center h-50 text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-1 px-6 pb-6">
              {recentTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={token.imageUrl} alt={token.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {token.symbol.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{token.name}</p>
                      <Badge variant="outline" className="text-xs">
                        ${token.symbol}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {formatDistanceToNow(new Date(token.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={token.isListed ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {token.isListed ? "Listed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
