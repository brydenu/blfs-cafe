import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return <ResetPasswordForm />;
}