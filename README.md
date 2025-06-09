# 🌟 Task Noir

[![🚀 Deploy Task Noir to AWS](https://github.com/luciferreeves/tasknoir/actions/workflows/deploy.yml/badge.svg)](https://github.com/luciferreeves/tasknoir/actions/workflows/deploy.yml)

A modern task management application built with the T3 Stack.

## ✨ Features

### 🏠 Dashboard
- Task statistics overview with status and priority breakdowns
- Recent activity feed showing task updates and changes
- Project overview with progress tracking
- Upcoming deadlines and overdue task alerts
- Quick actions for creating tasks and projects

### 📋 Task Management
- Create, read, update, and delete tasks
- Priority levels: LOW, MEDIUM, HIGH, URGENT
- Status workflow: TODO, IN_PROGRESS, REVIEW, COMPLETED
- Multi-user task assignments
- Due date management with deadline tracking
- Task comments system
- File attachments support
- Subtask management
- Advanced filtering by status, priority, assignments, due dates, and subtasks

### 🏗️ Project Management
- Create and manage projects
- Add team members to projects
- Project ownership and access control
- Task organization within projects

### 👥 User Management
- User authentication with NextAuth.js
- User profiles with bio and image support
- Role-based access: USER and ADMIN roles
- Admin panel for user management

### 🎨 UI/UX
- Dark/Light mode support
- Responsive design
- Modern Tailwind CSS styling
- User avatars with fallback to initials
- Rich text editor for task descriptions
- File upload and preview capabilities

## 🏗️ Technology Stack

### T3 Stack Core
- **[Next.js 15](https://nextjs.org)** - React framework
- **[TypeScript](https://typescriptlang.org)** - Type safety
- **[tRPC](https://trpc.io)** - End-to-end typesafe APIs
- **[Prisma](https://prisma.io)** - Database ORM
- **[NextAuth.js](https://next-auth.js.org)** - Authentication
- **[Tailwind CSS](https://tailwindcss.com)** - Styling

### Additional Technologies
- **[Supabase](https://supabase.com)** - Database and file storage
- **[SST](https://sst.dev)** - AWS deployment platform
- **[React Query](https://tanstack.com/query)** - Data fetching and caching
- **[TipTap](https://tiptap.dev)** - Rich text editor
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Password hashing
- **[Lucide React](https://lucide.dev)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme switching

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-noir
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```bash
   # Next Auth
   AUTH_SECRET="your-auth-secret"
   
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/task-noir"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) View your database
   npx prisma studio
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
task-noir/
├── prisma/                        # Database schema and migrations
├── public/                        # Static assets
├── src/
│   ├── components/                # React components
│   │   ├── FileUpload.tsx
│   │   ├── HtmlPreview.tsx
│   │   ├── Loading.tsx
│   │   ├── MarkdownPreview.tsx
│   │   ├── Navbar.tsx
│   │   ├── SubtaskManagement.tsx
│   │   ├── TagInput.tsx
│   │   ├── TaskAttachments.tsx
│   │   ├── TaskComments.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── UserAvatar.tsx
│   │   └── WysiwygEditor.tsx
│   ├── env.js                     # Environment validation
│   ├── lib/
│   │   └── supabase.ts           # Supabase client
│   ├── pages/                     # Next.js pages
│   │   ├── admin/                # Admin pages
│   │   ├── api/                  # API routes
│   │   ├── auth/                 # Authentication pages
│   │   ├── profile/              # Profile pages
│   │   ├── projects/             # Project pages
│   │   ├── tasks/                # Task pages
│   │   ├── _app.tsx
│   │   ├── dashboard.tsx
│   │   ├── index.tsx
│   │   └── profile.tsx
│   ├── server/                    # Server-side code
│   │   ├── api/                  # tRPC routers
│   │   ├── auth/                 # Auth configuration
│   │   └── db.ts                 # Database connection
│   ├── styles/
│   │   └── globals.css           # Global styles
│   └── utils/
│       └── api.ts                # tRPC client setup
├── sst.config.ts                  # SST deployment config
└── package.json                   # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbo
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format:check` - Check code formatting
- `npm run format:write` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run sst:dev` - Start SST development
- `npm run sst:deploy` - Deploy with SST
- `npm run sst:deploy:prod` - Deploy to production
- `npm run sst:remove` - Remove SST deployment

## 🚀 Deployment

This project uses [SST](https://sst.dev) for deployment to AWS.

### Development
```bash
npm run sst:dev
```

### Production Deployment
```bash
npm run sst:deploy:prod
```
