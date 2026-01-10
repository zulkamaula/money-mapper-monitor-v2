# 📚 M3 Nuxt - Documentation

Complete documentation for the M3 (Money Mapper Monitor) application.

---

## 🚀 Quick Links

- **New to the project?** Start with [Development Patterns](./development/API_PATTERNS.md)
- **Deploying?** Check [Deployment Checklist](./deployment/DEPLOYMENT_CHECKLIST.md)
- **Migrating database?** See [Migration Guide](./development/MIGRATION_GUIDE.md)

---

## 📂 Documentation Structure

### 🔧 [Development](./development/)
Core development patterns, guides, and best practices.

| Document | Description |
|----------|-------------|
| [API Patterns](./development/API_PATTERNS.md) | **⭐ Required reading** - Backend/frontend patterns, composables, preventing N+1 queries |
| [UI Conventions](./development/UI_CONVENTIONS.md) | **⭐ Required reading** - UI/UX patterns, Vuetify components, design guidelines |
| [Migration Guide](./development/MIGRATION_GUIDE.md) | Database migration procedures and best practices |
| [Security Fix](./development/SECURITY_FIX.md) | Security vulnerabilities and fixes applied |

---

### ✨ [Features](./features/)
Feature-specific documentation and implementation guides.

| Document | Description |
|----------|-------------|
| [Holdings Refactoring](./features/HOLDINGS_REFACTORING_GUIDE.md) | Complete guide for holdings → transactions migration |
| [Investment Feature Progress](./features/INVESTMENT_FEATURE_PROGRESS.md) | Investment tracking feature implementation status |

---

### 🚀 [Deployment](./deployment/)
Deployment guides and infrastructure setup.

| Document | Description |
|----------|-------------|
| [Deployment Checklist](./deployment/DEPLOYMENT_CHECKLIST.md) | Pre-deployment verification checklist |
| [Clerk + Neon + Netlify](./deployment/CLERK_NEON_NETLIFY.md) | Authentication & database setup guide |
| [Nitro Netlify Guide](./deployment/NITRO_NETLIFY_GUIDE.md) | Nuxt 3 Nitro deployment configuration |

---

### ⚙️ [Infrastructure](./infrastructure/)
Performance optimization and error handling.

| Document | Description |
|----------|-------------|
| [API Error Handling](./infrastructure/API_ERROR_HANDLING.md) | Error handling patterns across the stack |
| [Optimization Guide](./infrastructure/OPTIMIZATION_GUIDE.md) | Performance optimization strategies |

---

## 🎯 Common Tasks

### Starting Development
1. Read [API Patterns](./development/API_PATTERNS.md) for coding standards
2. Review existing composables in `composables/` folder
3. Follow patterns when creating new features

### Adding a New Feature
1. **Plan**: Document in `features/` folder
2. **Backend**: Follow [API Patterns](./development/API_PATTERNS.md) → prevent N+1 queries
3. **Frontend**: Use composable patterns → cache-first, AbortController
4. **Test**: Verify no duplicate API calls, proper error handling

### Deploying to Production
1. Run through [Deployment Checklist](./deployment/DEPLOYMENT_CHECKLIST.md)
2. Verify all environment variables set
3. Test in staging environment first
4. Monitor post-deployment using Netlify logs

### Database Migration
1. Read [Migration Guide](./development/MIGRATION_GUIDE.md)
2. Backup database first (CRITICAL!)
3. Test migration in development
4. Document migration in `features/` if feature-specific

---

## 📖 Learning Path

### For New Developers
```
1. README.md (root) - Project overview
2. docs/development/API_PATTERNS.md - Core patterns ⭐
3. Browse composables/ folder - See patterns in action
4. Read feature docs in features/ - Understand implementation
```

### For AI/LLM Agents
```
1. docs/README.md - Navigation (this file)
2. docs/development/API_PATTERNS.md - Architecture patterns
3. Inline comments in code - References to docs
4. Feature docs for specific context
```

---

## 🔄 Documentation Standards

### When to Create New Documentation

**DO create documentation for:**
- ✅ New architectural patterns or conventions
- ✅ Feature implementation guides (>100 lines changed)
- ✅ Database migrations
- ✅ Infrastructure changes
- ✅ Security fixes or updates

**DON'T create documentation for:**
- ❌ Minor bug fixes
- ❌ Simple UI tweaks
- ❌ Self-explanatory code changes

### Where to Put Documentation

| Type | Location | Example |
|------|----------|---------|
| Patterns/Conventions | `development/` | API patterns, coding standards |
| Feature implementation | `features/` | Holdings refactoring guide |
| Deployment/Setup | `deployment/` | Clerk setup, Netlify config |
| Performance/Errors | `infrastructure/` | Optimization, error handling |

### Documentation Format

```markdown
# Title - Clear and Descriptive

**Date:** YYYY-MM-DD
**Status:** Draft/Ready/Archived

## Overview
Brief description (2-3 sentences)

## Problem/Context
Why this document exists

## Solution/Implementation
How to do it (step-by-step if guide)

## Examples
Code examples or reference implementations

## References
Links to related docs or resources
```

---

## 🆘 Need Help?

1. **Search docs:** Use your editor's search across `docs/` folder
2. **Check patterns:** [API Patterns](./development/API_PATTERNS.md) covers most common issues
3. **Code references:** Inline comments link back to docs
4. **Git history:** `git log --oneline -- docs/` shows doc evolution

---

**Last Updated:** January 10, 2026  
**Maintained By:** Development Team
