# InvoiceFlow - Professional Invoicing Solution

## Overview

InvoiceFlow is a comprehensive full-stack invoicing application designed for businesses to create, manage, and track invoices with integrated payment processing. The application provides a complete invoice lifecycle management system, from draft creation to payment confirmation, with email notifications and real-time status updates.

The system supports dynamic invoice calculations, business information management with local storage persistence, secure file uploads for business logos, and Stripe integration for payment processing. It features a responsive design optimized for both desktop and mobile use, built with modern web technologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 and TypeScript, utilizing a component-based architecture with modern React patterns. The UI framework leverages Tailwind CSS for styling with a custom design system based on Shadcn/ui components, providing consistent visual elements throughout the application.

State management is handled through TanStack Query for server state management and caching, while local state uses React's built-in hooks. The routing system uses Wouter for lightweight client-side navigation. Form handling is implemented with React Hook Form combined with Zod validation schemas for type-safe form validation.

The application follows a responsive-first design approach with a sidebar navigation layout that adapts to mobile screens. The component structure is organized into reusable UI components, page components, and business logic hooks.

### Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design pattern. The architecture separates concerns into distinct layers: routing, business logic, data access, and external service integrations.

The data access layer uses Drizzle ORM with PostgreSQL, providing type-safe database operations and migrations. The storage layer is abstracted through an interface pattern, allowing for potential database provider changes without affecting business logic.

Business logic is encapsulated in service modules for specific domains like email notifications and payment processing. The server implements middleware for request logging, error handling, and JSON parsing.

### Data Storage Solutions
PostgreSQL serves as the primary database, managed through Neon's serverless PostgreSQL service. The database schema includes tables for users and invoices, with JSONB fields for flexible invoice line item storage.

Object storage is handled through Google Cloud Storage integration, used primarily for business logo uploads and file management. The system includes an access control layer for object permissions and security.

Local storage is used on the client side for persisting business information, providing offline access to frequently used data and reducing server requests for static business details.

### Authentication and Authorization
The current implementation appears to prepare for user authentication with a users table in the database schema, though the full authentication flow is not yet implemented in the visible codebase. The system includes user creation and lookup methods in the storage layer.

Object-level access controls are implemented for file uploads through a custom ACL (Access Control List) system that manages permissions for stored objects in Google Cloud Storage.

### External Service Integrations

**Stripe Payment Processing**: The application integrates with Stripe for secure payment processing, including checkout session creation and webhook handling for payment confirmations. The integration supports real-time payment status updates and automatic invoice status changes.

**Email Notifications**: Nodemailer is used for sending transactional emails, including invoice delivery notifications and payment confirmations. The email service supports both SMTP and Gmail configurations with customizable email templates.

**Object Storage**: Google Cloud Storage integration provides secure file upload capabilities with proper access controls. The system uses signed URLs for secure file access and implements metadata-based ACL policies.

**Development Tools**: The application integrates with Replit-specific services for development, including error overlays and cartographer for enhanced development experience.