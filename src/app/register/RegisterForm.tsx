'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { registerUser } from "./actions";

// ... (Keep existing schema and types - no changes here) ...
const registerSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional().refine((val) => {
        if (!val) return true;
        const digits = val.replace(/\D/g, '');
        return digits.length === 10;
    }, "Phone number must be 10 digits"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  
  const { register, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  // ... (Keep onSubmit function - no changes here) ...
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName || "",
        phone: data.phone || "",
      });

      if (result.success) {
        router.push('/login?registered=true'); 
      } else {
        setError("email", { message: result.message });
      }
    } catch (err) {
      setError("root", { message: "Something went wrong. Please try again." });
    }
  };

  // ... (Keep handlePhoneChange function - no changes here) ...
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      let formatted = rawValue;
      if (rawValue.length > 0) {
        if (rawValue.length < 4) formatted = rawValue;
        else if (rawValue.length < 7) formatted = `(${rawValue.slice(0, 3)}) ${rawValue.slice(3)}`;
        else formatted = `(${rawValue.slice(0, 3)}) ${rawValue.slice(3, 6)}-${rawValue.slice(6, 10)}`;
      }
      setValue("phone", formatted, { shouldValidate: false });
  };

  // ... (Keep getInputClass function - no changes here) ...
  const getInputClass = (fieldName: keyof RegisterFormData) => {
       const hasError = errors[fieldName];
       const baseClass = "w-full px-4 py-3 rounded-lg border outline-none transition-all text-gray-900 placeholder-gray-400";
       if (hasError) return `${baseClass} border-red-500 focus:ring-2 focus:ring-red-200`;
       return `${baseClass} border-gray-300 focus:ring-2 focus:ring-[#32A5DC] focus:border-transparent`;
  };

  return (
    // CHANGE 1: Use tighter padding on mobile (p-4), regular padding on desktop (sm:p-6)
    <main className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* ... Background (No changes) ... */}
        <div className="absolute inset-0 z-0 bg-[#004876]">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* CHANGE 2: Adjust header padding for mobile */}
            <div className="bg-gray-50 px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 relative mb-4">
                    <Image src="/logo.png" alt="BioLife Cafe Logo" fill className="object-contain" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#004876]">Create Account</h1>
                <p className="text-gray-500 text-sm mt-1">Join BioLife Cafe today</p>
            </div>

            {/* CHANGE 3: Adjust form padding for mobile */}
            <div className="p-6 sm:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    
                    {/* CHANGE 4 (MAIN REQUEST): Stack on mobile (grid-cols-1), side-by-side on desktop (sm:grid-cols-2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input {...register("firstName")} className={getInputClass("firstName")} placeholder="Jane" />
                            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input {...register("lastName")} className={getInputClass("lastName")} placeholder="Doe" />
                        </div>
                    </div>

                    {/* ... Rest of the form inputs remain exactly the same ... */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input {...register("email")} type="email" className={getInputClass("email")} placeholder="jane@example.com" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                        <input {...register("phone")} onChange={handlePhoneChange} className={getInputClass("phone")} placeholder="(555) 123-4567" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input {...register("password")} type="password" className={getInputClass("password")} />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input {...register("confirmPassword")} type="password" className={getInputClass("confirmPassword")} />
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>

                    {errors.root && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                            {errors.root.message}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 rounded-lg shadow-md transition-all hover:scale-[1.02] active:scale-[0.97] active:translate-y-[2px] mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:translate-y-0"
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#004876] font-bold hover:underline">Sign In</Link>
                </div>
            </div>
        </div>
    </main>
  );
}