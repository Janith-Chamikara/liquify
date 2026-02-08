import { Compass, HelpCircle, LayoutDashboard, Settings } from "lucide-react";

export const mainNav = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Explore",
    href: "/dashboard/explore",
    icon: Compass,
  },
];

export const secondaryNav = [
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];
