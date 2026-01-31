'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';

type AuthResult = string | { success: true } | undefined;

// Debug logging helper
function logDebug(location: string, message: string, data?: any) {
  if (typeof window === 'undefined') {
    // Server-side logging
    console.log(`[SERVER ${location}] ${message}`, data || '');
  } else {
    // Client-side logging
    console.log(`[CLIENT ${location}] ${message}`, data || '');
  }
}

export async function authenticate(
  prevState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  const email = formData.get('email') as string;
  logDebug('actions.ts:authenticate', 'Starting authentication', { email, hasPrevState: !!prevState });
  
  try {
    // Use redirect: false to prevent NextAuth from throwing redirect Response
    // This gives us more control over the flow
    logDebug('actions.ts:signIn', 'Calling signIn with redirect:false');
    const result = await signIn('credentials', {
      email,
      password: formData.get('password') as string,
      redirect: false,
    });
    
    logDebug('actions.ts:signIn', 'signIn returned', { result, resultType: typeof result, isNull: result === null });
    
    // With redirect: false, signIn returns null on success or throws on error
    // But let's verify the session was actually created
    // Add a small delay to ensure the session cookie is written
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logDebug('actions.ts:session-check', 'Checking session after signIn');
    const session = await auth();
    logDebug('actions.ts:session-check', 'Session check result', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (session?.user) {
      logDebug('actions.ts:success', 'Authentication successful, returning success');
      return { success: true };
    }
    
    logDebug('actions.ts:no-session', 'No session found after signIn, returning error');
    return 'Invalid credentials.';
  } catch (error) {
    logDebug('actions.ts:error', 'Caught error in authenticate', {
      errorName: error?.constructor?.name,
      isResponse: error instanceof Response,
      isAuthError: error instanceof AuthError,
      errorType: error instanceof AuthError ? error.type : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    
    // If it's a Response redirect (shouldn't happen with redirect: false, but just in case)
    if (error instanceof Response) {
      logDebug('actions.ts:response-error', 'Got Response error, checking session');
      const session = await auth();
      if (session?.user) {
        logDebug('actions.ts:response-success', 'Session found after Response error, returning success');
        return { success: true };
      }
    }
    
    // Handle auth errors
    if (error instanceof AuthError) {
      logDebug('actions.ts:auth-error', 'AuthError caught', { type: error.type });
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    
    logDebug('actions.ts:unknown-error', 'Unknown error, rethrowing', { error });
    throw error;
  }
}