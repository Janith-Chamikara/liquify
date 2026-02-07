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

  // Define Gold HSL values for consistency
  const goldRich = "hsl(35, 95%, 50%)";
  const goldBright = "hsl(45, 95%, 60%)";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <section className="relative py-12 md:py-20 flex items-center justify-center min-h-[80vh]">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--foreground)/0.05)_0%,transparent_70%)]" />
        {/* Changed background blobs to have a very subtle warm tint */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[hsl(35,95%,50%)]/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-[hsl(45,95%,50%)]/[0.02] rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Text Content (Unchanged) */}
            <div className="space-y-10 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-muted/50 backdrop-blur-sm">
                {/* Changed pulse dot to gold */}
                <div className="w-2 h-2 rounded-full bg-[hsl(35,95%,50%)] animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground tracking-wide">
                  Live on Solana Devnet
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">The Future of</span>
                <br />
                {/* Updated text gradient to gold */}
                <span className="bg-gradient-to-r from-[hsl(35,95%,50%)] via-[hsl(45,95%,60%)] to-muted-foreground/60 bg-clip-text text-transparent">
                  Decentralized
                </span>
                <br />
                <span className="text-foreground">Trading</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Create tokens, provide liquidity, and execute swaps with
                institutional-grade speed. Built for the next generation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/dashboard">
                  {/* Updated button style to have a gold border/hover effect */}
                  <Button
                    size="lg"
                    className="w-full sm:w-auto border-goldRich/50 hover:bg-goldRich/10 hover:text-goldRich transition-colors"
                  >
                    Enter Platform
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Layered Coin Visuals */}
            <div className="relative h-[500px] lg:h-[650px] order-1 lg:order-2 perspective-1000">
              {/* Decorative Background Rings - tinted gold */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-[hsl(35,95%,50%)]/20 rounded-full z-0" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-[hsl(35,95%,50%)]/10 rounded-full z-0" />

              {/* 1. GIGA Coin (Back Layer - Top Left) */}
              <div
                className={`absolute top-[20%] left-[15%] z-10 transition-all duration-1000 delay-300 ${
                  mounted
                    ? "opacity-90 translate-y-0 scale-100"
                    : "opacity-0 translate-y-10 scale-90"
                }`}
              >
                <div className="relative animate-float-slow brightness-[0.8] blur-[1px]">
                  {/* Subtle GOLD glow for background coin. Changed from bg-muted-foreground/20 */}
                  <div className="absolute inset-0 bg-[hsl(35,95%,50%)]/20 rounded-full blur-xl scale-105" />
                  <Image
                    src="/giga_coin.png"
                    alt="GIGA CHAD"
                    width={180}
                    height={180}
                    // Added a slight gold tint to the drop shadow
                    className="relative drop-shadow-[0_4px_20px_hsl(35,95%,50%,0.15)] grayscale-[30%]"
                  />
                </div>
              </div>

              {/* 2. USD Coin (Back Layer - Bottom Right) */}
              <div
                className={`absolute bottom-[22%] right-[15%] z-10 transition-all duration-1000 delay-500 ${
                  mounted
                    ? "opacity-90 translate-y-0 scale-100"
                    : "opacity-0 translate-y-10 scale-90"
                }`}
              >
                <div className="relative animate-float-delayed brightness-[0.85] blur-[1px]">
                  {/* Subtle GOLD glow for background coin. Changed from bg-chart-4/20 */}
                  <div className="absolute inset-0 bg-[hsl(45,95%,50%)]/20 rounded-full blur-xl scale-105" />
                  <Image
                    src="/usd_coin.png"
                    alt="USD Coin"
                    width={160}
                    height={160}
                    // Added a slight gold tint to the drop shadow
                    className="relative drop-shadow-[0_4px_20px_hsl(45,95%,50%,0.15)]"
                  />
                </div>
              </div>

              {/* 3. SOLANA Coin (Front Layer - Center Big) */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-1000 cubic-bezier(0.17, 0.55, 0.55, 1) ${
                  mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
              >
                <div className="relative animate-float">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[hsl(35,100%,45%)]/40 via-[hsl(48,100%,55%)]/30 to-transparent blur-3xl scale-125" />

                  <div className="relative rounded-full p-1 bg-gradient-to-b from-[hsl(48,100%,70%)]/30 to-transparent shadow-2xl shadow-black/40">
                    <Image
                      src="/solana_coin.png"
                      alt="Solana"
                      width={340}
                      height={340}
                      className="relative drop-shadow-[0_10px_60px_hsl(var(--foreground)/0.3)]"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade fade (Unchanged) */}
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
            transform: translateY(-20px) rotate(2deg);
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-15px) rotate(-3deg) scale(1.02);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-18px) rotate(2deg) scale(0.98);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }

        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
