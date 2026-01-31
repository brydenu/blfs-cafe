'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';

type AuthResult = string | { success: true } | undefined;

export async function authenticate(
  prevState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:11',message:'authenticate called',data:{hasPrevState:!!prevState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:16',message:'calling signIn',data:{email:formData.get('email')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // In production, signIn throws a Response redirect that useActionState doesn't handle properly
    // We'll catch it, verify the session, and return a success indicator for client-side redirect
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:24',message:'signIn completed without throw',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:28',message:'signIn threw error',data:{isResponse:error instanceof Response,isAuthError:error instanceof AuthError,errorType:error instanceof AuthError?error.type:'unknown',errorName:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // If it's a Response redirect, it means sign-in succeeded but redirect handling failed
    // Check session and return success indicator
    if (error instanceof Response) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:33',message:'Response redirect caught, checking session',data:{status:error.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const session = await auth();
      if (session?.user) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:37',message:'session confirmed, returning success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return { success: true };
      }
    }
    
    // Handle auth errors
    if (error instanceof AuthError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:45',message:'returning auth error message',data:{errorType:error.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:54',message:'rethrowing unknown error',data:{errorName:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw error;
  }
  
  // Verify session was created successfully
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:61',message:'verifying session after signIn',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const session = await auth();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:63',message:'session verification result',data:{hasSession:!!session,hasUser:!!session?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  if (session?.user) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:66',message:'returning success indicator',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return { success: true };
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eb01caa9-f5ac-41a5-8b5a-2e44e7ce188c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'actions.ts:71',message:'returning invalid credentials',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return 'Invalid credentials.';
}