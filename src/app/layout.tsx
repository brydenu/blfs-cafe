import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/providers/CartProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { CUSTOMER_APP_NAME } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: `%s - ${CUSTOMER_APP_NAME}`,
    default: CUSTOMER_APP_NAME,
  },
  description: "Internal Coffee Ordering System",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}