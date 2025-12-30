# 💰 Money Mapper Monitor v2

A modern, full-stack money management application built with Nuxt 4, Vue 3, and Vuetify 3. Track your income allocations across multiple pockets with a beautiful, responsive interface.

## ✨ Features

- 🔐 **Secure Authentication** - Powered by Clerk
- 📚 **Multiple Money Books** - Organize finances by categories
- 💼 **Pocket Management** - Allocate money to different pockets with percentage-based distribution
- 📊 **Allocation History** - Track all your income allocations with detailed breakdowns
- 📱 **Responsive Design** - Optimized for mobile, tablet, and desktop
- 🎨 **Modern UI** - Clean, fresh design with Vuetify Material Design components
- ⚡ **Real-time Updates** - Instant UI updates with Vue 3 Composition API
- 🌐 **SSR Ready** - Server-side rendering with Nuxt 4

## 🛠️ Tech Stack

### Frontend
- **Nuxt 4** - Vue framework with SSR
- **Vue 3** - Progressive JavaScript framework
- **Vuetify 3** - Material Design component library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool

### Backend
- **Nuxt Server API** - API routes
- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Clerk** - Authentication and user management

### Deployment
- **Netlify** - Hosting and CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- pnpm (recommended) or npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/zulkamaula/money-mapper-monitor-v2.git
cd money-mapper-monitor-v2
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Clerk Authentication
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_JWT_ISSUER=https://xxx.clerk.accounts.dev

# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host/database
```

4. Run database migrations
```bash
# See server/db/schema.sql for database setup
```

5. Start development server
```bash
pnpm dev
```

Visit `http://localhost:3000`

## 📦 Project Structure

```
m3-nuxt/
├── app.vue                 # Root application component
├── assets/
│   └── css/
│       └── main.css       # Global styles
├── components/            # Vue components
│   ├── AllocationDialog.vue
│   ├── AllocationsHistory.vue
│   ├── AppFooter.vue
│   ├── AppNavbar.vue
│   ├── LegalDocument.vue
│   ├── LoginForm.vue
│   ├── MoneyBookSelector.vue
│   └── PocketsManager.vue
├── layouts/              # Layout components
│   ├── blank.vue        # Minimal layout (login)
│   └── default.vue      # Main layout with navbar/footer
├── middleware/          # Route middleware
│   └── auth.ts         # Authentication guard
├── pages/              # Application pages
│   ├── about.vue
│   ├── contact.vue
│   ├── dashboard.vue
│   ├── index.vue       # Landing/login page
│   ├── privacy.vue
│   └── terms.vue
├── plugins/
│   └── vuetify.ts      # Vuetify configuration
├── server/
│   ├── api/            # API endpoints
│   │   ├── allocations.get.ts
│   │   ├── allocations.post.ts
│   │   ├── allocations/[id].delete.ts
│   │   ├── money-books.get.ts
│   │   ├── money-books.post.ts
│   │   ├── pockets.get.ts
│   │   ├── pockets.post.ts
│   │   ├── pockets/[id].delete.ts
│   │   └── pockets/[id].patch.ts
│   ├── db/             # Database utilities
│   │   ├── schema.sql
│   │   └── migration scripts
│   ├── middleware/
│   │   └── auth.ts    # Server-side auth
│   ├── types/
│   │   └── index.ts   # Server types
│   └── utils/
│       ├── auth.ts    # Auth utilities
│       └── db.ts      # Database client
├── types/
│   └── models.ts      # Type definitions
├── utils/
│   └── format.ts      # Formatting utilities
├── netlify.toml       # Netlify configuration
├── nuxt.config.ts     # Nuxt configuration
└── package.json
```

## 🔧 Development

### Build for Production
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

### Type Checking
```bash
npx nuxi typecheck
```

## 🌐 Deployment

### Netlify (Recommended)

1. Push to GitHub
```bash
git push origin main
```

2. Import to Netlify
- Connect your GitHub repository
- Configure build settings (auto-detected from `netlify.toml`)

3. Set environment variables in Netlify dashboard:
```
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_JWT_ISSUER
NEON_DATABASE_URL
```

4. Deploy!

## 📝 Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (public) | `pk_test_xxx` |
| `CLERK_JWT_ISSUER` | Clerk JWT issuer URL (private) | `https://xxx.clerk.accounts.dev` |
| `NEON_DATABASE_URL` | PostgreSQL connection string (private) | `postgresql://user:pass@host/db` |

## 🎨 Key Features Breakdown

### Money Book Management
- Create multiple money books for different purposes
- Switch between books seamlessly
- Edit and delete books with confirmation

### Pocket System
- Create pockets with percentage-based allocation
- Visual feedback for total percentage (must equal 100%)
- Real-time validation

### Allocation Tracking
- Record income allocations with automatic distribution
- View allocation history with expandable details
- Copy amounts to clipboard
- Add notes to allocations

### Responsive Design
- Mobile-first approach
- Collapsible cards on mobile
- Sticky action buttons for better UX
- Optimized text sizes and spacing

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

Private - All rights reserved

## 👤 Author

**Zulkariski .M**
- GitHub: [@zulkamaula](https://github.com/zulkamaula)

## 🙏 Acknowledgments

- Built with [Nuxt](https://nuxt.com/)
- UI components from [Vuetify](https://vuetifyjs.com/)
- Authentication by [Clerk](https://clerk.com/)
- Database hosted on [Neon](https://neon.tech/)
