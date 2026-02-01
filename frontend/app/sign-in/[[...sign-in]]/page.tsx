import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
// import circuitWiringImage from "@/public/circuit_wiring.png";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="w-full max-w-sm">
        <SignIn fallbackRedirectUrl={"/"} routing="path" path="/sign-in" />
      </div>
    </div>
  );
}
