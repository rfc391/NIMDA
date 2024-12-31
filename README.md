
# NINDA (National Intelligence Network Data Analyzer)

NINDA is a web-based intelligence management system designed for law enforcement, private security companies, and intelligence agencies. It aligns with the National Intelligence Model framework and provides comprehensive tools for information gathering, analysis, intelligence assessment, dissemination, resource allocation, and performance management.

A modern web application built with React, Express, and PostgreSQL, featuring authentication, real-time updates, and a responsive dashboard.

## 🚀 Features

- User Authentication
- Real-time Updates via WebSocket
- Responsive Dashboard
- PostgreSQL Database
- Modern UI with Tailwind CSS
- TypeScript Support

## 📦 Tech Stack

- **Frontend:** React, TanStack Query, Tailwind CSS, Radix UI
- **Backend:** Express, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Real-time:** WebSocket

## 🛠️ Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Page components
│   │   └── main.tsx       # Entry point
├── db/                     # Database configuration
├── server/                 # Backend Express server
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API routes
│   └── websocket.ts       # WebSocket handlers
```

## 🚦 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application at `http://0.0.0.0:5000`

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check
- `npm run db:push` - Update database schema

## 🔒 Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string

## 📄 License

MIT License
