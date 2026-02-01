import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log((await auth()).sessionClaims?.onbardingComplete);
  if ((await auth()).sessionClaims?.onboardingComplete === true) {
    redirect("/");
  }

  return <>{children}</>;
}
