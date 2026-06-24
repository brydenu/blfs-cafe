import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Cart");

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
