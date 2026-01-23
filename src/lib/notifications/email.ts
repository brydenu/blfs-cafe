import nodemailer from 'nodemailer';
import { NotificationProvider, NotificationType, NotificationPayload } from './types';

// Configure your transport (Use environment variables in production)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or 'host: smtp.example.com'
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // App Password (not your normal password)
  },
});

export const EmailProvider: NotificationProvider = {
  async send(type: NotificationType, payload: NotificationPayload) {
    const { to, data } = payload;
    let subject = '';
    let html = '';

    switch (type) {
      case 'ORDER_COMPLETED':
        // Format drink details for email
        const formatDrinkDetails = (items: any[]) => {
          return items.map((item: any) => {
            const details: string[] = [];
            
            // Product name and temperature
            let drinkLine = `<strong>${item.product.name}</strong>`;
            if (item.temperature) {
              drinkLine += ` - ${item.temperature}`;
            }
            
            // Recipient name if present
            if (item.recipientName) {
              drinkLine += ` (for ${item.recipientName})`;
            }
            
            details.push(drinkLine);
            
            // Shots
            const shots = item.shots || 0;
            if (shots > 0) {
              details.push(`${shots} shot${shots !== 1 ? 's' : ''}`);
            }
            
            // Caffeine type
            if (item.caffeineType && item.caffeineType !== 'Normal') {
              details.push(item.caffeineType);
            }
            
            // Milk
            if (item.milkName && item.milkName !== 'No Milk') {
              details.push(item.milkName);
            }
            
            // Modifiers (syrups, toppings, etc.)
            if (item.modifiers && item.modifiers.length > 0) {
              item.modifiers.forEach((mod: any) => {
                if (mod.ingredient.category !== 'milk') {
                  const qty = mod.quantity > 1 ? ` (${mod.quantity})` : '';
                  details.push(`${mod.ingredient.name}${qty}`);
                }
              });
            }
            
            // Cup type
            if (item.cupType && item.cupType !== 'to-go') {
              let cupTypeLabel = '';
              if (item.cupType === 'for-here') {
                const isIced = item.temperature && item.temperature.startsWith('Iced');
                cupTypeLabel = isIced ? 'For-Here Glass' : 'For-Here Mug';
              } else if (item.cupType === 'personal') {
                cupTypeLabel = 'Personal Cup';
              } else {
                cupTypeLabel = item.cupType;
              }
              details.push(cupTypeLabel);
            }
            
            // Special instructions
            if (item.specialInstructions) {
              details.push(`Note: "${item.specialInstructions}"`);
            }
            
            return details.join(' • ');
          }).join('<br><br>');
        };
        
        const drinkDetailsHtml = formatDrinkDetails(data.items || []);
        
        subject = `Your Order is Ready!`;
        html = `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #004876; margin-bottom: 20px;">Your Order is Ready! ☕</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">Hey ${data.name},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Your order of:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #32A5DC;">
              <div style="font-size: 15px; line-height: 1.8; color: #333;">
                ${drinkDetailsHtml}
              </div>
            </div>
            <p style="font-size: 16px; margin-bottom: 30px;">has been completed, and is waiting for you at the pickup counter.</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you!</p>
            <a href="${process.env.NEXT_PUBLIC_URL}/order-confirmation/${data.publicIdFull}" style="background: #32A5DC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Order</a>
          </div>
        `;
        break;

      case 'PASSWORD_RESET':
        subject = 'Reset Your Password';
        html = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #004876;">Password Reset Request</h1>
            <p>Someone requested a password reset for this account.</p>
            <p>Click the button below to reset it (valid for 1 hour):</p>
            <a href="${data.resetLink}" style="background: #003355; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p style="font-size: 12px; color: gray; margin-top: 20px;">If this wasn't you, ignore this email.</p>
          </div>
        `;
            break;
        
        case 'WELCOME':
        subject = 'Welcome to the BioLife Cafe! ☕';
        html = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #004876;">Welcome, ${data.name}!</h1>
            <p>Thanks for creating an account.</p>
            <p>You can now:</p>
            <ul>
                <li>Save your favorite custom drinks</li>
                <li>Quickly order and reorder favorites</li>
                <li>Track your order status in real-time</li>
                <li>Receive notifications when your order is ready</li>
            </ul>
            <br>
            <a href="${process.env.NEXT_PUBLIC_URL}/menu" style="background: #32A5DC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Start an Order Now</a>
          </div>
        `;
        break;
        
       // Add more cases easily here
    }

    try {
      await transporter.sendMail({
        from: '"BioLife Cafe" <no-reply@cafeapp.com>',
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent to ${to} [${type}]`);
      return true;
    } catch (error) {
      console.error("❌ Email Failed:", error);
      return false;
    }
  }
};