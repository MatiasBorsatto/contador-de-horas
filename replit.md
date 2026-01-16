# Weekly Work Hours Tracker

## Overview

A web application for tracking weekly work hours and calculating earnings. Users can register daily worked hours (start time, end time), view weekly summaries, and calculate total pay based on configurable hourly rates. The system automatically computes hours worked per entry and aggregates them by week (Monday through Sunday).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Shadcn/UI component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod resolver for validation
- **Date Handling**: date-fns library for date manipulation and formatting

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in shared routes file
- **Build**: Custom build script using esbuild for server bundling and Vite for client

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-based validation
- **Schema Location**: `shared/schema.ts` contains table definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Shared Code Structure
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Database table definitions and Zod validation schemas
- `routes.ts`: API route definitions with request/response type contracts

### Key Design Patterns
- **Type Safety**: End-to-end TypeScript with shared types between client and server
- **Validation**: Zod schemas for both database inserts and API request validation
- **Hours Calculation**: Server-side computation of `hoursWorked` from start/end times
- **Week Boundaries**: Monday-Sunday week calculation using date-fns

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: PostgreSQL session store (available for session management)

### UI Libraries
- **Radix UI**: Complete primitive component set for accessible UI elements
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **Vaul**: Drawer component
- **cmdk**: Command palette component

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **Drizzle Kit**: Database migration and schema management