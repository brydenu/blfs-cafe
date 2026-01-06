import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const session = await auth();
  
  // Redirect logged-in users to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}