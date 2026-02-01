"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Twitter,
  Send,
  MessageCircle,
  Copy,
  ExternalLink,
  ImageIcon,
  Check,
} from "lucide-react";
import { Token } from "@/lib/types";
import { useState } from "react";

type Props = {
  token: Token | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TokenDetailDialog({ token, open, onOpenChange }: Props) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  if (!token) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);

    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-4xl p-0 overflow-hidden gap-0 border-none ring-0">
        <div className="grid md:grid-cols-2 h-full md:max-h-[600px]">
          {/* LEFT SIDE: Big Image Display */}
          <div className="bg-muted/30 flex items-center justify-center p-6 md:p-10 border-b md:border-b-0 md:border-r relative">
            {/* Background blur effect (optional aesthetic) */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20"
              style={{ backgroundImage: `url(${token.imageUrl})` }}
            />

            <div className="relative h-48 w-48 md:h-full md:w-full max-h-[400px] aspect-square shadow-2xl rounded-2xl overflow-hidden ring-1 ring-border/50">
              <Avatar className="h-full w-full rounded-none">
                <AvatarImage
                  src={token.imageUrl}
                  className="object-cover w-full h-full"
                />
                <AvatarFallback className="h-full w-full rounded-none text-4xl">
                  <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* RIGHT SIDE: Details */}
          <ScrollArea className="h-full max-h-[500px] md:max-h-[600px]">
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <DialogTitle className="text-3xl md:text-4xl font-bold break-words leading-tight">
                      {token.name}
                    </DialogTitle>
                    {token.isListed && (
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 whitespace-nowrap shrink-0"
                      >
                        Trading Live
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xl font-semibold text-primary">
                      ${token.symbol}
                    </span>
                    <span>•</span>
                    <DialogDescription className="text-xs truncate max-w-[200px]">
                      Created by{" "}
                      <span className="font-mono">{token.creatorWallet}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Description */}
              <div className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                {token.description || "No description provided for this token."}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    Total Supply
                  </p>
                  <p className="font-mono text-lg font-medium truncate">
                    {token.supply.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-card border rounded-xl shadow-sm">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                    Decimals
                  </p>
                  <p className="font-mono text-lg font-medium">
                    {token.decimals}
                  </p>
                </div>
              </div>

              {/* Mint Address */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Contract Address
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <code className="flex-1 p-3 w-full bg-muted/50 border rounded-lg text-xs font-mono text-foreground break-all">
                    {token.mintAddress}
                  </code>

                  <Button
                    variant={isCopied ? "secondary" : "outline"}
                    size="icon"
                    className="flex gap-2 w-full transition-all duration-200"
                    onClick={() => copyToClipboard(token.mintAddress)}
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{isCopied ? "Copied" : "Copy Address"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex gap-2 w-full"
                    asChild
                  >
                    <a
                      href={`https://explorer.solana.com/address/${token.mintAddress}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View more</span>
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Socials */}
              <div className="flex flex-wrap gap-2">
                {token.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a href={token.website} target="_blank">
                      <Globe className="h-4 w-4 mr-2" /> Website
                    </a>
                  </Button>
                )}
                {token.twitter && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a href={token.twitter} target="_blank">
                      <Twitter className="h-4 w-4 mr-2" /> Twitter
                    </a>
                  </Button>
                )}
                {token.telegram && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a href={token.telegram} target="_blank">
                      <Send className="h-4 w-4 mr-2" /> Telegram
                    </a>
                  </Button>
                )}
                {token.discord && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a href={token.discord} target="_blank">
                      <MessageCircle className="h-4 w-4 mr-2" /> Discord
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
