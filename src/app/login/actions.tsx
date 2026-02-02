'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

type AuthResult = string | { success: true } | undefined;

export async function authenticate(
  prevState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return 'Email and password are required.';
  }
  
  try {
    // Use redirect: false to prevent automatic redirect
    // This allows us to return a result to the client
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    // In NextAuth v5, signIn with redirect: false returns undefined on success
    // or throws AuthError on failure
    // If we reach here without an error, authentication succeeded
    return { success: true };
  } catch (error) {
    // Handle AuthError from NextAuth
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return 'Invalid credentials.';
      }
      return 'Authentication failed. Please try again.';
    }
    
    // For any other error, return a generic message
    console.error('Authentication error:', error);
    return 'Something went wrong. Please try again.';
  }
}