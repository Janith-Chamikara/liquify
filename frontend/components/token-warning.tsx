import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type TokenCreationWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TokenCreationWarningDialog({
  open,
  onOpenChange,
}: TokenCreationWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Multiple Wallet Signatures Required
          </AlertDialogTitle>

          <AlertDialogDescription className="space-y-3">
            <span>
              Creating a token happens in <strong>3 signing stages</strong>.
              Your wallet will prompt you multiple times — this is expected.
            </span>

            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Stage 1:</strong> Upload token metadata (image & info)
              </li>
              <li>
                <strong>Stage 2:</strong> Create the token mint on Solana
              </li>
              <li>
                <strong>Stage 3:</strong> Mint the initial token supply
              </li>
            </ul>

            <p className="text-sm text-muted-foreground">
              Please do not refresh or reject transactions once started.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction variant={"destructive"}>
            I understand, continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
