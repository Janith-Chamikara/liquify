"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react"; // <--- The correct standard import
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function truncate(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function WalletConnectButton() {
  const { select, wallets, publicKey, disconnect, connected } = useWallet();

  const [open, setOpen] = useState(false);

  const address = publicKey ? publicKey.toString() : null;

  async function handleConnect(walletName: string) {
    try {
      select(walletName as any);
      setOpen(false);
    } catch (err) {
      console.error("Connection failed", err);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect();
      setOpen(false);
    } catch (err) {
      console.error("Disconnect failed", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-w-[140px] justify-between">
          {address ? (
            <span className="font-mono">{truncate(address)}</span>
          ) : (
            <span>Connect wallet</span>
          )}
          {/* Status Dot */}
          <span
            className={`ml-2 h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-slate-300"}`}
          />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {connected ? "Wallet Account" : "Connect Wallet"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {connected ? (
            // CONNECTED VIEW
            <div className="space-y-4">
              <div className="rounded-xl border p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1">
                  Connected Address
                </p>
                <p className="font-mono text-lg font-medium  break-all">
                  {address}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="w-full"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            // DISCONNECTED VIEW (Wallet List)
            <div className="space-y-2">
              {wallets.map((wallet) => (
                <Button
                  key={wallet.adapter.name}
                  variant="outline"
                  onClick={() => handleConnect(wallet.adapter.name)}
                  className="w-full justify-between h-12 text-base"
                >
                  <div className="flex items-center gap-3">
                    {/* Render the wallet icon dynamically */}
                    <img
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      className="w-6 h-6"
                    />
                    <span>{wallet.adapter.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {wallet.readyState === "Installed" ? "Detected" : ""}
                  </span>
                </Button>
              ))}

              {wallets.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-4">
                  No Solana wallets detected. Please install Phantom or
                  Solflare.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
