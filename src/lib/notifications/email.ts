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
        subject = `Order #${data.publicId} is Ready!`;
        html = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #004876;">Your Drink is Ready! ☕</h1>
            <p>Hi ${data.name},</p>
            <p>Your order <strong>#${data.publicId}</strong> has been completed by the barista.</p>
            <p>Please head to the pickup counter.</p>
            <a href="${process.env.NEXT_PUBLIC_URL}/order-confirmation/${data.publicIdFull}" style="background: #32A5DC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Receipt</a>
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
        from: '"Cafe App" <no-reply@cafeapp.com>',
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