# Enterprise Project Management MVP

A small but professional project management application built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and NextAuth.

## Features

- Email/password authentication with NextAuth credentials provider
- Registration and password hashing with bcrypt
- First registered account becomes Admin for easier hosted setup
- Role-based access control: Admin, Manager, Member
- Protected dashboard with project/task metrics, charts, and recent activity
- Project CRUD with team membership
- Task CRUD with search and filtering
- Per-project Kanban board with drag and drop status updates
- Admin user management and role changes
- Reports for completion, status, priority, overdue tasks, and workload
- Admin-only audit log for important changes
- Zod validation and basic in-memory auth rate limiting

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

3. Start PostgreSQL and set `DATABASE_URL` in `.env`.

4. Run migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Seed Accounts

All seed accounts use password `Password123!`.

- `admin@example.com` - Admin
- `manager@example.com` - Manager
- `member@example.com` - Member

## Role Permissions

- Admin can manage all users, roles, projects, tasks, reports, and audit logs.
- Manager can create projects, edit owned projects, assign team members, and manage tasks on owned projects.
- Member can view assigned project work and update assigned task status.

## Structure

- `app/(auth)` - login, registration, and auth actions
- `app/(app)` - protected application routes and server actions
- `components` - reusable UI, forms, charts, and Kanban board
- `lib` - auth, Prisma, validation, rate limiting, utilities
- `prisma` - schema and seed script

## Production Notes

Use a durable rate limiter such as Redis for production auth throttling. The included limiter is process-local and intended as an MVP guardrail.

## Vercel Deployment

See `DEPLOYMENT.md` for Vercel setup with hosted PostgreSQL, environment variables, migrations, and seed data.
