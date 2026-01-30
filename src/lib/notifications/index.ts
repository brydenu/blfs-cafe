import { EmailProvider } from './email';
import { NotificationType } from './types';

// We can add SMSProvider here later
const providers = [EmailProvider]; 

export async function sendNotification(
  type: NotificationType, 
  to: string, 
  data: any
) {
  // We loop through all active providers. 
  // In the future, you could check user preferences here (e.g. if (user.prefersSms) ...)
  
  if (!to) return;

  const results = await Promise.all(
    providers.map(p => p.send(type, { to, data }))
  );

  return results.every(r => r === true);
}