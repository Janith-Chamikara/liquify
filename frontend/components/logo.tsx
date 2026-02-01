import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

type LogoProps = {
  size?: number;
  alt?: string;
  className?: string;
  withText?: boolean;
  text?: string;
};

export default function Logo({ alt = "Cogni Lab", className = "" }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex items-center gap-3 ${className}`.trim()}>
        <div style={{ width: 100, height: 48 }} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <Image
        src={resolvedTheme === "dark" ? "/logo-white.png" : "/logo-black.png"}
        alt={alt}
        width={100}
        height={48}
        priority
      />
    </div>
  );
}
