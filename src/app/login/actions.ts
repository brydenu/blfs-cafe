'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  } catch (error) {
    // signIn may throw redirects or errors
    // If it's a redirect, let it propagate
    if (error instanceof Response) {
      throw error;
    }
    
    // Check if sign-in actually succeeded by verifying session
    const session = await auth();
    if (session?.user) {
      redirect('/dashboard');
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
  
  // If we reach here, sign-in succeeded but didn't redirect
  // Verify session and redirect manually
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }
  
  return 'Invalid credentials.';
}