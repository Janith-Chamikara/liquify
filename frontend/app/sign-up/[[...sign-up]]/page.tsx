import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import signalGenerator from "@/public/signal_generator.png";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="w-full max-w-sm">
        <SignUp fallbackRedirectUrl={"/"} routing="path" path="/sign-up" />
      </div>
    </div>
  );
}
