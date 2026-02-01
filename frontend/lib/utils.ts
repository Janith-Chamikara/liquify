import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (num: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: num > 1_000_000 ? "compact" : "standard",
  }).format(num);

export const truncateAddress = (addr: string) =>
  `${addr.slice(0, 4)}...${addr.slice(-4)}`;
