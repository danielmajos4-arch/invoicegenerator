# InvoiceFlow - Professional Invoicing Solution

A full-stack invoicing application built with React, Express.js, PostgreSQL, and Stripe payments.

## Features

- **Invoice Management**: Create, edit, and track invoices with multiple statuses (DRAFT, SENT, PAID)
- **Business Information**: Store and manage business details with localStorage persistence
- **Dynamic Calculations**: Auto-calculate totals with quantity, rate, and optional tax
- **Email Notifications**: Send invoice links via Nodemailer
- **Stripe Integration**: Secure payments with Stripe Checkout
- **Logo Upload**: Upload and manage business logos
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Updates**: Webhook handling for payment confirmations

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Wouter for routing
- TanStack Query for state management
- React Hook Form for form handling
- Shadcn/ui components

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Stripe SDK for payments
- Nodemailer for email
- Object storage for file uploads

## Setup Instructions

### Prerequisites

1. Node.js 18+ and npm
2. PostgreSQL database
3. Stripe account
4. Email service (Gmail/SMTP)

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Object Storage (if using)
PRIVATE_OBJECT_DIR=/your-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket/public

# App
FRONTEND_URL=https://your-repl-domain
