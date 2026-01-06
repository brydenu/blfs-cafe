import { redirect } from "next/navigation";

export default function AdminGateway() {
  redirect("/admin/dashboard");
}