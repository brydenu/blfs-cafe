export type NotificationType = 
  | 'ORDER_CONFIRMATION' 
  | 'ORDER_COMPLETED' 
  | 'PASSWORD_RESET'
  | 'WELCOME';

export interface NotificationPayload {
  to: string; // Email address or Phone number
  data: any;  // Dynamic data (Order ID, Link, Name, etc)
}

// The Interface every provider (Email, SMS) must implement
export interface NotificationProvider {
  send(type: NotificationType, payload: NotificationPayload): Promise<boolean>;
}