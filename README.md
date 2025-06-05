# 🌟 Task Noir

[![🚀 Deploy Task Noir to AWS](https://github.com/[YOUR_USERNAME]/task-noir/actions/workflows/deploy.yml/badge.svg)](https://github.com/[YOUR_USERNAME]/task-noir/actions/workflows/deploy.yml)
[![✅ Status Checks](https://github.com/[YOUR_USERNAME]/task-noir/actions/workflows/checks.yml/badge.svg)](https://github.com/[YOUR_USERNAME]/task-noir/actions/workflows/checks.yml)
[![🎭 Preview Deployment](https://github.com/[YOUR_USERNAME]/task-noir/actions/workflows/preview.yml/badge.svg)](https://github.com/[YOUR_USERNAME]/task-noir/actions/workflows/preview.yml)

A modern, full-stack task management application built with the [T3 Stack](https://create.t3.gg/) and deployed to AWS.

## ✨ Features

- 🔐 **Secure Authentication** - NextAuth.js with custom credentials
- 🗄️ **Database** - PostgreSQL with Prisma ORM
- 🎨 **Modern UI** - Tailwind CSS for beautiful styling
- 🚀 **Auto-Deployment** - GitHub Actions + AWS SST
- 📱 **Responsive Design** - Works on all devices
- 🔒 **Type Safety** - Full TypeScript coverage

## 🏗️ Tech Stack

## 🏗️ Tech Stack

- ⚡ [Next.js](https://nextjs.org) - React framework for production
- 🔐 [NextAuth.js](https://next-auth.js.org) - Authentication for Next.js
- 🗄️ [Prisma](https://prisma.io) - Type-safe database ORM
- 🎨 [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- 🔗 [tRPC](https://trpc.io) - End-to-end typesafe APIs
- ☁️ [AWS SST](https://sst.dev) - Full-stack serverless framework
- 🚀 [GitHub Actions](https://github.com/features/actions) - CI/CD automation

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/[YOUR_USERNAME]/task-noir.git
   cd task-noir
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Setup

Create a `.env` file with these variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## 🚀 Deployment

This project automatically deploys to AWS using GitHub Actions:

1. **Set up GitHub Secrets** (see [DEPLOYMENT.md](.github/DEPLOYMENT.md))
2. **Push to main branch** - Triggers automatic deployment
3. **Create a release tag** - Triggers production release

### 🎭 Preview Deployments

Pull requests automatically get preview deployments:
- Each PR gets its own staging environment
- Preview URLs are posted as PR comments
- Automatically cleaned up when PR is closed

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## 🎯 Project Structure

```
src/
├── pages/           # Next.js pages and API routes
├── server/          # Server-side code (tRPC, auth, db)
├── styles/          # Global styles
└── utils/           # Utility functions

prisma/
├── schema.prisma    # Database schema
└── migrations/      # Database migrations

.github/
└── workflows/       # GitHub Actions workflows
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Built with the amazing [T3 Stack](https://create.t3.gg/)
- Deployed on [AWS](https://aws.amazon.com/) with [SST](https://sst.dev/)
- CI/CD powered by [GitHub Actions](https://github.com/features/actions)

---

**Happy coding!** 🚀✨

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
