"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Token } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TokenTableProps = {
  tokens: Token[];
  isLoading?: boolean;
  onSelect: (token: Token) => void;
};

export function TokenTable({ tokens, isLoading, onSelect }: TokenTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-50" />
                  <Skeleton className="h-3 w-25" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="font-medium mb-1">No tokens yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Launch your first token to get started
            </p>
            <Button size="sm" asChild>
              <a href="/dashboard/launch">Launch Token</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Token</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead className="hidden md:table-cell">Supply</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow
                key={token.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelect(token)}
              >
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={token.imageUrl} alt={token.name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {token.symbol.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-36">
                      {token.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  ${token.symbol}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatNumber(token.supply)}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(token);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
