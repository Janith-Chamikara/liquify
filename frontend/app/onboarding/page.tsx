"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@solana/wallet-adapter-react";

import { onboardingSchema, type OnboardingFormValues } from "@/lib/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import WalletConnectButton from "@/components/wallet-connect-button";
import { completeOnboarding } from "@/lib/actions";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const { publicKey, connected } = useWallet();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      walletAddress: "",
    },
  });

  useEffect(() => {
    if (connected && publicKey) {
      form.setValue("walletAddress", publicKey.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      form.setValue("walletAddress", "");
    }
  }, [connected, publicKey, form]);

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsSubmitting(true);
    setError("");

    const res = await completeOnboarding(values);

    if (res?.message) {
      await user?.reload();
      console.log(user);
      router.push("/");
    }

    if (res?.error) {
      setError(res.error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <Card className="relative z-10 w-full max-w-lg border-border shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Igloo</CardTitle>
          <CardDescription>
            Connect your Solana wallet to create your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <div className="flex w-full items-start gap-2">
                  <div className="shrink-0">
                    <WalletConnectButton />
                  </div>

                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Address will appear here..."
                            readOnly
                            className="font-mono text-xs bg-slate-50 text-muted-foreground cursor-not-allowed h-10" // h-10 matches default button height
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !connected}
              >
                {isSubmitting ? "Creating Account..." : "Continue"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
