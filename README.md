# BaristaOS - BioLife Cafe Ordering System

A modern, full-featured coffee ordering application built for internal use at BioLife Solutions. BaristaOS provides a streamlined ordering experience with real-time order tracking, comprehensive admin management tools, and a beautiful, responsive user interface.

## 🚀 Overview

BaristaOS is a complete coffee shop management and ordering system that enables employees to place orders, track their status in real-time, and manage their favorite drinks. Administrators have access to a comprehensive dashboard for managing orders, menu items, inventory, schedules, and more.

### Key Highlights

- **Free Service**: All drinks are complimentary for internal use
- **Guest Checkout**: Order without creating an account
- **Real-Time Updates**: Live order status tracking via WebSocket connections
- **Mobile Responsive**: Fully optimized for all device sizes
- **Admin Dashboard**: Complete management interface for operations
- **Scheduled Orders**: Plan and schedule orders in advance
- **Favorites System**: Save and quickly reorder favorite drinks

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth v5](https://authjs.dev/)
- **Real-Time**: Socket.io
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text**: Tiptap
- **Charts**: Recharts
- **Email**: Nodemailer

## ✨ Features

### Customer Features

- **Menu Browsing**: Browse coffee, tea, and other beverages with detailed descriptions
- **Drink Customization**: Extensive customization options including:
  - Milk types (Oat, Whole, Almond, etc.)
  - Espresso shots
  - Temperature (Hot/Iced)
  - Syrups and modifiers
  - Foam levels
  - Caffeine type (Normal, Decaf, Half-Caff)
  - Special instructions
- **Shopping Cart**: Add multiple items with different customizations
- **Order Tracking**: Real-time order status updates (Queued → Preparing → Ready → Completed)
- **Order History**: View past orders and reorder favorites
- **Favorites**: Save customized drinks for quick reordering
- **Scheduled Orders**: Schedule orders for future pickup times
- **Guest Checkout**: Place orders without creating an account
- **User Dashboard**: Personalized dashboard with recent orders, favorites, and quick actions
- **Notifications**: Email notifications for order status updates
- **Suggestions**: Submit feedback and suggestions to administrators

### Admin Features

- **Order Queue Management**: Real-time order queue with status updates and timers
- **Menu Management**: Create, edit, and manage menu items
- **Inventory Management**: Track ingredients and availability
- **User Management**: View and manage user accounts
- **Statistics Dashboard**: Comprehensive analytics and reporting
- **Schedule Management**: Configure cafe hours and availability
- **Featured Drinks**: Highlight special or seasonal drinks
- **Communications**: Create and manage announcements/banners
- **Suggestion Management**: Review and respond to user suggestions
- **Order History**: Detailed order history with search and filtering
- **Observer Mode**: Fullscreen order display for kitchen/barista stations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** 10.x or higher (comes with Node.js)
- **PostgreSQL** 12+ (or access to a PostgreSQL database)
- **Git**

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blfs-cafe
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/baristaos?schema=public"

# NextAuth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# Email Configuration (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Socket.io (optional, for production)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

**Note**: Generate a secure `AUTH_SECRET` using:
```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database with sample data
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 6. Start Socket Server (for real-time updates)

In a separate terminal:

```bash
node socket-server.js
```

The socket server will run on port 3001 by default.

## 📁 Project Structure

```
blfs-cafe/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migrations
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── menu/              # Menu browsing and customization
│   │   ├── cart/              # Shopping cart
│   │   ├── track/             # Order tracking
│   │   └── auth/              # Authentication pages
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utility functions and configurations
│   ├── providers/             # React context providers
│   └── auth.ts                # NextAuth configuration
├── public/                    # Static assets
├── socket-server.js           # Socket.io server for real-time updates
└── package.json
```

## 🗄️ Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User**: User accounts with roles (admin/customer)
- **Product**: Menu items (coffee, tea, etc.)
- **Ingredient**: Customization options (milks, syrups, etc.)
- **Order**: Customer orders with status tracking
- **OrderItem**: Individual items within an order
- **SavedOrder**: User favorites
- **Schedule**: Cafe operating hours
- **Communication**: Announcements and banners
- **Suggestion**: User feedback and suggestions

See `prisma/schema.prisma` for the complete schema definition.

## 🚀 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database commands
npx prisma studio          # Open Prisma Studio (database GUI)
npx prisma migrate dev     # Create and apply migrations
npx prisma generate        # Regenerate Prisma Client
npm run prisma:seed        # Seed database
```

### Development Guidelines

- **Type Safety**: Strict TypeScript is enforced. Avoid using `any`.
- **Server Actions**: Use Server Actions (`'use server'`) for mutations instead of API routes.
- **Styling**: Use Tailwind CSS for all styling. Follow the established design patterns.
- **Components**: Keep components small and focused on a single responsibility.
- **Database**: Always read `schema.prisma` before making database queries. Never guess column names.

## 🎨 Design System

### Admin Interface
- **Background**: Dark Navy (`#004876` or `bg-gray-900`)
- **Accents**: Bright Blue (`#32A5DC`)
- **Text**: White (`text-white`) or Light Gray (`text-gray-400`)

### Customer Interface
- **Background**: Blue with dot pattern (`#004876`)
- **Accents**: Bright Blue (`#32A5DC`)
- **Cards**: White with subtle shadows

### Icons
- Custom outline-style icons (single color, consistent style)
- Located in `src/components/icons/`

## 📦 Deployment

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

The application can be deployed to:
- AWS EC2 (with PM2 and Nginx)
- Vercel
- Any Node.js hosting platform

### Quick Deployment Checklist

1. Set up PostgreSQL database (RDS or managed service)
2. Configure environment variables
3. Run database migrations
4. Build the application: `npm run build`
5. Start the production server: `npm start`
6. Configure reverse proxy (Nginx) for production
7. Set up SSL certificate (Let's Encrypt)
8. Configure Socket.io server for real-time updates

## 🔐 Authentication

The application uses NextAuth v5 with:
- **Credentials Provider**: Email/password authentication
- **JWT Sessions**: Stateless session management
- **Role-Based Access**: Admin and customer roles
- **Guest Checkout**: Orders can be placed without authentication

## 📧 Email Notifications

Email notifications are sent for:
- Order status updates (per-drink or order-complete)
- Password reset requests
- Account-related communications

Configure SMTP settings in environment variables.

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Ensure all TypeScript types are properly defined
3. Test on mobile devices for responsiveness
4. Update documentation as needed
5. Follow the project's design system and UI patterns

## 📝 Important Notes

- **No Payment Processing**: This is a free service. No payment references should appear in the UI.
- **Guest Orders**: Orders can have `null` user values. Always check for user existence before accessing user properties.
- **Order IDs**: Order IDs are integers, not strings. Convert to string when needed for display.
- **Real-Time Updates**: Socket.io is used for live order status updates. Ensure the socket server is running in production.

## 📄 License

This project is proprietary software for internal use at BioLife Solutions.

## 🆘 Support

For issues, questions, or suggestions, please contact the development team or submit a suggestion through the application's suggestion system.

---

**Built for BioLife Solutions**
