import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./ResetPasswordForm";
import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Reset Password");

export default async function ResetPasswordPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return <ResetPasswordForm />;
}