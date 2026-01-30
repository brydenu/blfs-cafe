import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth"; // <--- Added Auth Import
import CommunicationBanner from "@/components/CommunicationBanner";
import ScheduleDisplay from "@/components/ScheduleDisplay";
import ScheduleLink from "@/components/ScheduleLink";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const session = await auth(); // <--- Check Session
  const isLoggedIn = !!session?.user;

  // Fetch schedule data
  const schedules = await prisma.schedule.findMany({
    orderBy: { dayOfWeek: 'asc' }
  });

  return (
    <main className="relative min-h-screen flex flex-col w-full">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-[#004876]">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* HERO SECTION - Full viewport height */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 pt-20">
        
        {/* Communication Banner - Less prominent, positioned at top */}
        <div className="absolute top-4 left-0 right-0 max-w-4xl mx-auto px-6">
          <CommunicationBanner location="landing" />
        </div>
        
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mt-4">
          
          {/* LOGO SECTION */}
          <div className="mb-8 relative w-24 h-24 md:w-32 md:h-32">
            {/* The "Backlight" - A soft white glow behind the logo */}
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
            
            <Image 
              src="/logo.png" 
              alt="BioLife Cafe Logo" 
              fill
              className="object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            />
          </div>

          {/* Hero Headline */}
          <h1 className="text-6xl md:text-8xl font-extrabold text-white tracking-tighter mb-6 drop-shadow-xl">
            BioLife Cafe
          </h1>
          
          {/* Enhanced Tagline */}
          <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-2xl font-light leading-relaxed">
            Streamlined ordering for your workday.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg justify-center mb-8">
            {isLoggedIn ? (
              /* --- LOGGED IN BUTTONS --- */
              <>
                <Link href="/dashboard" className="flex-1 bg-white text-[#004876] font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 text-lg border-2 border-transparent text-center active:scale-95">
                  Go to Dashboard
                </Link>
                <Link href="/menu" className="flex-1 bg-[#32A5DC] text-white font-bold py-4 px-8 rounded-full hover:bg-[#32A5DC] hover:text-white hover:shadow-[0_0_20px_rgba(50,165,220,0.5)] hover:scale-105 transition-all duration-300 text-lg text-center active:scale-95">
                  Order Now
                </Link>
              </>
            ) : (
              /* --- LOGGED OUT BUTTONS --- */
              <>
                <Link href="/login" className="flex-1 bg-white text-[#004876] font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 text-lg border-2 border-transparent text-center active:scale-95">
                  Login / Sign Up
                </Link>
                <Link href="/menu" className="flex-1 bg-transparent border-2 border-[#32A5DC] text-[#32A5DC] font-bold py-4 px-8 rounded-full hover:bg-[#32A5DC] hover:text-white hover:shadow-[0_0_20px_rgba(50,165,220,0.5)] hover:scale-105 transition-all duration-300 text-lg text-center active:scale-95">
                  Order as Guest
                </Link>
              </>
            )}
          </div>

          {/* Secondary CTA - Styled as subtle link */}
          <Link href="/track" className="text-sm text-blue-200 hover:text-white underline underline-offset-4 transition-colors opacity-80 hover:opacity-100 mb-12">
            Have an order code? Track status here →
          </Link>

          {/* Schedule Link - Clickable to scroll to schedule */}
          <div className="mb-12">
            <ScheduleLink />
          </div>
        </div>
      </section>

      {/* SUPPORTING CONTENT - Below the fold */}
      <section id="schedule-section" className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-12">
        <ScheduleDisplay schedules={schedules as any} />
      </section>
    </main>
  );
}