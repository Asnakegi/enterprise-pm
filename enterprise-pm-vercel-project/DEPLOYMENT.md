# Deploy to Vercel

This project is ready for Vercel, but it needs a hosted PostgreSQL database.

Recommended setup:

- Vercel for the Next.js app
- Neon or Supabase for PostgreSQL

## 1. Create PostgreSQL Database

Create a free PostgreSQL database at one of these:

- Neon: https://neon.tech
- Supabase: https://supabase.com

Copy the PostgreSQL connection string. It should look similar to:

```env
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

## 2. Upload the Project

Option A, easiest:

1. Put this project in a GitHub repository.
2. Go to https://vercel.com/new.
3. Import the repository.
4. Set the root directory to this app if needed.

Option B:

Use Vercel CLI from a less restricted computer:

```bash
npm install -g vercel
vercel
```

## 3. Add Vercel Environment Variables

In Vercel project settings, add:

```env
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_SECRET=your_long_random_secret
NEXTAUTH_URL=https://your-vercel-project.vercel.app
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

If OpenSSL is not available, use any secure random 32+ character string.

## 4. Build Settings

Vercel usually detects Next.js automatically.

Use these settings if it asks:

- Framework Preset: Next.js
- Install Command: `npm install`
- Build Command: `npm run vercel-build`
- Output Directory: `.next`

The Vercel build command runs `prisma migrate deploy` automatically, so the database tables are created during deployment.

## 5. Create Your Admin Account

Open the deployed Vercel URL and register your first account.

The first registered user automatically becomes `ADMIN`. Later registrations become `MEMBER` users.

## 6. Optional Seed Data

Seed data is optional. If you want demo projects and demo users, run this from a machine that can run Node:

```bash
npm install
npm run db:seed
```

If your current PC cannot run these commands, use a different computer or an online dev environment such as GitHub Codespaces.

## 7. Demo Login

Seed accounts use password:

```text
Password123!
```

Accounts:

- `admin@example.com`
- `manager@example.com`
- `member@example.com`

## Important Notes

- Update `NEXTAUTH_URL` after Vercel gives you the final production URL.
- For production, replace seed passwords immediately.
- The MVP uses in-memory rate limiting. For production, use Redis or Vercel KV.
