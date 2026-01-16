"use client";

import { useState } from "react";

export default function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      
      if (response.ok) {
        // Force a hard navigation to ensure session is cleared
        window.location.href = "/";
      } else {
        // Even if the API call fails, try to redirect
        window.location.href = "/";
      }
    } catch (error) {
      // On any error, still try to redirect
      window.location.href = "/";
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
