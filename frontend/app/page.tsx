"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <section className="relative py-2 flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--foreground)/0.05)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-foreground/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-muted-foreground/[0.05] rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-muted/50 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground tracking-wide">
                  Live on Solana Devnet
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">The Future of</span>
                <br />
                <span className="bg-gradient-to-r from-foreground via-muted-foreground to-muted-foreground/60 bg-clip-text text-transparent">
                  Decentralized
                </span>
                <br />
                <span className="text-foreground">Trading</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Create tokens, provide liquidity, and execute swaps with
                institutional-grade speed. Built for the next generation.
              </p>

              <Link href="/dashboard">
                <Button size="lg" className="w-full ">
                  Enter Platform
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative h-[500px] lg:h-[650px]">
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
                  mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
              >
                <div className="relative animate-float">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-chart-4/20 via-chart-5/10 to-chart-4/20 blur-2xl scale-125" />
                  <div className="absolute inset-0 rounded-full border border-border scale-[1.4]" />
                  <Image
                    src="/solana_coin.png"
                    alt="Solana"
                    width={300}
                    height={300}
                    className="relative drop-shadow-[0_0_50px_hsl(var(--foreground)/0.15)]"
                    priority
                  />
                </div>
              </div>

              <div
                className={`absolute top-4 left-4 transition-all duration-1000 delay-300 ${
                  mounted
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-10"
                }`}
              >
                <div className="relative animate-float-slow">
                  <div className="absolute inset-0 bg-muted-foreground/10 rounded-full blur-xl scale-110" />
                  <Image
                    src="/giga_coin.png"
                    alt="GIGA CHAD"
                    width={160}
                    height={160}
                    className="relative drop-shadow-[0_0_30px_hsl(var(--foreground)/0.1)] grayscale-[20%]"
                  />
                </div>
              </div>

              <div
                className={`absolute bottom-4 right-4 transition-all duration-1000 delay-500 ${
                  mounted
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-10"
                }`}
              >
                <div className="relative animate-float-delayed">
                  <div className="absolute inset-0 bg-chart-4/10 rounded-full blur-xl scale-110" />
                  <Image
                    src="/usd_coin.png"
                    alt="USD Coin"
                    width={140}
                    height={140}
                    className="relative drop-shadow-[0_0_30px_hsl(var(--chart-4)/0.15)]"
                  />
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-border/50 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-border/30 rounded-full" />
              <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-foreground/30 rounded-full animate-pulse" />
              <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-foreground/20 rounded-full animate-pulse delay-700" />
              <div className="absolute top-2/3 right-1/5 w-1 h-1 bg-foreground/40 rounded-full animate-ping" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-40" />
      </section>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(2deg);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) rotate(-2deg);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-22px) rotate(3deg);
          }
        }

        .animate-float {
          animation: float 7s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 9s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  );
}
