'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';

type AuthResult = string | { success: true } | undefined;

export async function authenticate(
  prevState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  try {
    // In production, signIn throws a Response redirect that useActionState doesn't handle properly
    // We'll catch it, verify the session, and return a success indicator for client-side redirect
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  } catch (error) {
    // If it's a Response redirect, it means sign-in succeeded but redirect handling failed
    // Check session and return success indicator
    if (error instanceof Response) {
      const session = await auth();
      if (session?.user) {
        return { success: true };
      }
    }
    
    // Handle auth errors
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    
    throw error;
  }
  
  // Verify session was created successfully
  const session = await auth();
  
  if (session?.user) {
    return { success: true };
  }
  
  return 'Invalid credentials.';
}