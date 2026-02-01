"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Compass,
  Settings,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "Launch Token",
    description: "Create a new token",
    icon: PlusCircle,
    href: "/dashboard/launch",
    variant: "default" as const,
  },
  {
    label: "Explore",
    description: "Discover new tokens",
    icon: Compass,
    href: "/dashboard/explore",
    variant: "outline" as const,
  },
  {
    label: "Wallet",
    description: "Manage your wallet",
    icon: Wallet,
    href: "#",
    variant: "outline" as const,
  },
  {
    label: "Settings",
    description: "Account settings",
    icon: Settings,
    href: "#",
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Button
              variant={action.variant}
              className="w-full h-auto py-4 flex-col items-start gap-1 group"
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className="h-4 w-4" />
                <span className="font-medium">{action.label}</span>
                <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs text-muted-foreground font-normal">
                {action.description}
              </span>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
