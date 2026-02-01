import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingProps = {
  className?: string;
};

export function Loading({ className }: LoadingProps) {
  return (
    <div
      className={cn("flex items-center justify-center w-full py-6", className)}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
