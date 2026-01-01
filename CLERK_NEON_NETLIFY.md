# Clerk & Neon di Netlify - Compatibility Guide

## ✅ Konfirmasi: Clerk dan Neon TIDAK Mempengaruhi Asset Serving

**TL;DR**: Clerk dan Neon berjalan di **server-side** (Netlify Function), tidak ada hubungannya dengan CDN serving aset client (`/_nuxt/*`, `public/*`).

---

## 🔐 Clerk (@clerk/nuxt) di Netlify

### Cara Kerja

```
Browser Request: GET /dashboard
│
├─ Netlify CDN: tidak ada file /dashboard → forward ke function
│
└─ Netlify Function (Nitro SSR):
   ├─ Middleware: middleware/auth.ts (client-side navigation)
   ├─ Server Middleware: server/middleware/auth.ts (SSR check)
   │  └─ Clerk SDK verify JWT dari cookie
   │     ├─ Valid → render halaman
   │     └─ Invalid → redirect ke /
   └─ Response: HTML + client bundle refs
```

### Pengaturan Minimal di Netlify

**Environment Variables** (Netlify UI → Site settings → Environment variables):

```bash
# Required
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx

# Optional tapi recommended
CLERK_JWT_ISSUER=https://your-tenant.clerk.accounts.dev
```

**nuxt.config.ts** (sudah benar):

```ts
export default defineNuxtConfig({
  modules: ['@clerk/nuxt'],
  runtimeConfig: {
    CLERK_JWT_ISSUER: process.env.CLERK_JWT_ISSUER,
    public: {
      clerkPublishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    }
  }
})
```

### Client-Side vs Server-Side Auth

#### Client-Side (`middleware/auth.ts`)

```ts
// Jalan di browser setelah halaman load
export default defineNuxtRouteMiddleware((to, from) => {
  const { userId } = useAuth()
  if (!userId.value && to.path === '/dashboard') {
    return navigateTo('/')
  }
})
```

**Asset serving**: Tidak terpengaruh (middleware jalan setelah HTML + JS load).

#### Server-Side (`server/middleware/auth.ts`)

```ts
// Jalan di Netlify Function sebelum render
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  // Verify JWT with Clerk
})
```

**Asset serving**: Tidak terpengaruh (middleware hanya cek request ke route, tidak ke `/_nuxt/*`).

### Clerk Script Loading

Clerk SDK load script di client:

```html
<!-- Auto-injected oleh @clerk/nuxt -->
<script src="https://[your-clerk-frontend-api]/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"></script>
```

**PENTING**: Script ini load dari **Clerk CDN**, bukan dari Netlify CDN. Tidak ada dependency ke `/_nuxt/*`.

### Troubleshooting Clerk di Netlify

| Issue | Cause | Fix |
|-------|-------|-----|
| `ClerkError: Missing publishableKey` | Env var tidak diset | Set `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` di Netlify UI |
| `401 Unauthorized` saat SSR | CLERK_SECRET_KEY salah | Cek env var, pastikan `sk_test_` atau `sk_live_` |
| Auth state tidak sync | Cookie SameSite issue | Tambahkan domain whitelist di Clerk Dashboard |
| `useAuth()` return null | Client-side only di SSR | Gunakan `getAuth(event)` di server-side |

**✅ Kesimpulan**: Clerk tidak block atau affect asset serving sama sekali.

---

## 🗄️ Neon Database (@neondatabase/serverless) di Netlify

### Cara Kerja

```
API Request: GET /api/money-books
│
├─ Netlify CDN: /api/* tidak ada di .output/public → function
│
└─ Netlify Function (Nitro handler):
   └─ server/api/money-books.get.ts
      └─ Neon.connect(NEON_DATABASE_URL)
         └─ Query database → JSON response
```

### Pengaturan Minimal di Netlify

**Environment Variables**:

```bash
# Required
NEON_DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Server API Handler** (`server/api/money-books.get.ts`):

```ts
import { neon } from '@neondatabase/serverless'

export default defineEventHandler(async (event) => {
  const sql = neon(useRuntimeConfig().NEON_DATABASE_URL)
  const result = await sql`SELECT * FROM money_books`
  return result
})
```

### Neon di Serverless Environment

**Advantages di Netlify Functions**:

1. **HTTP-based queries**: `@neondatabase/serverless` use WebSocket fallback, cocok untuk serverless
2. **No connection pooling**: Auto-managed oleh Neon
3. **Fast cold start**: ~100-300ms untuk establish connection

**Optimization**:

```ts
// ✅ Singleton pattern untuk reuse connection (warm start)
let cachedSql: ReturnType<typeof neon> | null = null

export default defineEventHandler(async (event) => {
  if (!cachedSql) {
    cachedSql = neon(useRuntimeConfig().NEON_DATABASE_URL)
  }
  const result = await cachedSql`SELECT * FROM money_books`
  return result
})
```

### Troubleshooting Neon di Netlify

| Issue | Cause | Fix |
|-------|-------|-----|
| `Error: connection refused` | DATABASE_URL salah | Cek format: `postgresql://user:pass@host/db?sslmode=require` |
| `TimeoutError` | Neon project suspended | Buka Neon Console, wake up project |
| `SSL error` | Missing `?sslmode=require` | Tambahkan query param di connection string |
| `ENOTFOUND` DNS error | Neon endpoint typo | Copy-paste URL dari Neon Dashboard |
| Function timeout (10s) | Query terlalu besar | Tambahkan pagination, index DB |

**✅ Kesimpulan**: Neon hanya dipanggil di server API routes, tidak ada hubungan dengan CDN asset serving.

---

## 🔒 Security Best Practices

### 1. Environment Variables

**❌ JANGAN** commit secrets ke Git:

```ts
// ❌ SALAH - hardcode di code
const sql = neon('postgresql://user:password@host/db')

// ✅ BENAR - dari env vars
const sql = neon(useRuntimeConfig().NEON_DATABASE_URL)
```

**✅ Set di Netlify UI**:
- Site settings → Environment variables → Add variable
- Scope: **All deployments** atau **Production only** (untuk sensitive)

### 2. Runtime Config

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only (TIDAK dikirim ke client)
    CLERK_JWT_ISSUER: process.env.CLERK_JWT_ISSUER,
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
    
    public: {
      // Boleh dibaca di client
      clerkPublishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    }
  }
})
```

**PENTING**: 
- `NEON_DATABASE_URL` di root runtimeConfig → server-only
- `NUXT_PUBLIC_*` prefix → exposed ke client
- Jangan pernah taruh database URL di `public`

### 3. Server Middleware Auth

Protect API routes dengan Clerk auth:

```ts
// server/middleware/auth.ts
import { clerkPlugin, getAuth } from '@clerk/nuxt/server'

export default defineEventHandler(async (event) => {
  // Skip auth untuk aset dan public routes
  const path = event.path
  if (path.startsWith('/_nuxt/') || path === '/') {
    return
  }

  // Auth untuk /api/*
  if (path.startsWith('/api/')) {
    const auth = getAuth(event)
    if (!auth.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }
  }
})
```

**✅ Benefit**: Clerk verify JWT di server sebelum query Neon, prevent unauthorized DB access.

---

## 🚀 Performance Considerations

### Cold Start Impact

**Netlify Function cold start sequence**:

```
Request → Function Start (500-2000ms)
├─ Load Node.js runtime (200ms)
├─ Import dependencies
│  ├─ @clerk/nuxt (50ms)
│  ├─ @neondatabase/serverless (30ms)
│  └─ Other deps (100-500ms)
├─ Initialize Clerk client (50ms)
├─ Connect to Neon (100-300ms)
└─ Execute handler (10-100ms)
```

**Total cold start**: ~1-3 detik untuk first request setelah idle.

### Optimization Tips

1. **Minimize dependencies di server routes**:
   ```ts
   // ❌ Hindari
   import * as allOfVuetify from 'vuetify'
   
   // ✅ Import spesifik
   import { neon } from '@neondatabase/serverless'
   ```

2. **Lazy load heavy modules**:
   ```ts
   // ✅ Dynamic import untuk route jarang dipanggil
   export default defineEventHandler(async (event) => {
     const { processLargeData } = await import('./heavy-module')
     return processLargeData()
   })
   ```

3. **Cache di edge** (untuk read-only data):
   ```ts
   export default defineCachedEventHandler(async (event) => {
     const sql = neon(useRuntimeConfig().NEON_DATABASE_URL)
     return await sql`SELECT * FROM static_data`
   }, {
     maxAge: 60 * 5, // Cache 5 menit
     swr: true
   })
   ```

### Bundle Size Monitoring

```bash
# Cek ukuran final server bundle
npm run build
du -sh .output/server/

# Target untuk optimal cold start:
# - < 5 MB: Excellent (cold start ~500ms)
# - 5-15 MB: Good (cold start ~1-2s)
# - > 20 MB: Review dependencies (cold start > 3s)
```

---

## ✅ Final Checklist: Clerk + Neon di Netlify

### Setup
- [ ] `@clerk/nuxt` di `modules` array
- [ ] `@neondatabase/serverless` di `dependencies` (bukan `devDependencies`)
- [ ] Environment variables diset di Netlify UI (bukan hardcode)
- [ ] `runtimeConfig` split server-only vs public

### Security
- [ ] Database URL tidak di-commit ke Git
- [ ] Clerk secret key tidak exposed ke client
- [ ] API routes protected dengan auth middleware
- [ ] `.env` di `.gitignore`

### Testing
- [ ] Clerk login/logout flow jalan di production
- [ ] API `/api/*` return data dari Neon
- [ ] SSR render user-specific data (auth-gated pages)
- [ ] No CORS errors di console

### Performance
- [ ] Server bundle < 15 MB
- [ ] Cold start < 3 detik (cek Function logs)
- [ ] Warm requests < 500ms
- [ ] Database queries have indexes (cek Neon Console)

---

## 🎯 Summary: Clerk & Neon vs Asset Serving

| Component | Runs On | Affects `/_nuxt/*` ? | Affects `public/*` ? |
|-----------|---------|----------------------|----------------------|
| Clerk client SDK | Browser | ❌ No | ❌ No |
| Clerk server verify | Netlify Function | ❌ No (hanya cek auth) | ❌ No |
| Neon queries | Netlify Function | ❌ No (server-only) | ❌ No |
| Nitro SSR | Netlify Function | ❌ No (render HTML) | ❌ No |
| CDN asset serving | Netlify CDN | ✅ Yes (this is the CDN) | ✅ Yes (this is the CDN) |

**Kesimpulan**: Clerk dan Neon **100% aman** dan tidak akan menyebabkan 404 di aset client. Masalah 404 aset **selalu** berasal dari:
1. Publish directory salah
2. Build gagal (tidak generate file)
3. Redirect rule yang salah route
4. Cache atau deployment artifact issue

---

## 📚 References

- [Clerk Nuxt Docs](https://clerk.com/docs/references/nuxt/overview)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [Nitro Netlify Preset](https://nitro.unjs.io/deploy/providers/netlify)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
