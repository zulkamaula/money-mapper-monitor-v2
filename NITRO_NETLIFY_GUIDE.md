# Panduan Nitro Netlify Adapter untuk Nuxt 4

## 📁 Struktur Output Nitro `preset: 'netlify'`

Ketika Anda build dengan `npm run build` menggunakan `nitro.preset = 'netlify'`, Nuxt 4 menghasilkan:

```
.output/
├── public/                    # ← PUBLISH DIRECTORY (CDN)
│   ├── _nuxt/                 # ← Client bundle (CSS, JS, chunks)
│   │   ├── entry.{hash}.js
│   │   ├── entry.{hash}.css
│   │   ├── {component}.{hash}.js
│   │   └── ...
│   ├── favicon.ico            # ← File dari /public
│   ├── robots.txt
│   └── (file lain dari /public)
│
└── server/                    # ← NITRO SSR FUNCTION (auto-detect)
    ├── index.mjs              # ← Entry point Netlify Function
    ├── chunks/                # ← Server-side chunks
    │   ├── nitro/
    │   ├── routes/
    │   └── ...
    └── node_modules/          # ← Bundled dependencies (Clerk, Neon, dll)
```

### Lokasi Fungsi SSR

Nitro Netlify adapter **otomatis** membuat Netlify Function di:
- **Path internal**: `.netlify/functions/server` (Netlify auto-detect dari `.output/server/`)
- **Nama function**: `server` atau `___netlify-handler`
- **Runtime**: Node.js (sesuai NODE_VERSION di netlify.toml)

**PENTING**: Anda **TIDAK PERLU** set `functions` directory di netlify.toml atau Netlify UI. Nitro adapter menangani ini otomatis.

---

## ⚙️ Netlify UI Settings - Apa yang HARUS dan JANGAN Diubah

### ✅ Setting yang HARUS Dikonfigurasi

| Setting | Value | Lokasi |
|---------|-------|--------|
| **Build command** | `npm run build` | Site settings → Build & deploy → Build settings |
| **Publish directory** | `.output/public` | Site settings → Build & deploy → Build settings |
| **Node version** | 20 (dari netlify.toml) | Otomatis dari `[build.environment]` |

### ❌ Setting yang JANGAN Diubah (Biarkan Default/Kosong)

| Setting | Value | Alasan |
|---------|-------|--------|
| **Functions directory** | **KOSONGKAN** | Nitro auto-detect dari `.output/server/` |
| **Base directory** | **KOSONGKAN** | Kecuali Anda punya monorepo |
| **Ignore command** | **KOSONGKAN** | Gunakan Git branch deploy settings jika perlu |

### 🔧 Environment Variables yang Perlu Diset

Di Netlify UI → Site settings → Environment variables:

```bash
# Clerk (required)
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_JWT_ISSUER=https://xxx.clerk.accounts.dev

# Neon Database (required)
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Optional: Nuxt build optimization
NODE_OPTIONS=--max-old-space-size=4096
```

**JANGAN** commit `.env` ke Git! Gunakan `.env.example` untuk dokumentasi.

---

## 🔍 Cara Nitro Netlify Adapter Bekerja

### Build Process

1. **`npm run build`** dipanggil oleh Netlify CI
2. Nuxt 4 build client + server
3. Nitro dengan `preset: 'netlify'`:
   - Bundle client assets → `.output/public/`
   - Bundle server function → `.output/server/index.mjs`
   - Copy file dari `/public` → `.output/public/`
4. Netlify deploy:
   - Upload `.output/public/` ke **CDN**
   - Upload `.output/server/` sebagai **Netlify Function**

### Request Routing

```
Request: https://yoursite.netlify.app/_nuxt/entry.abc123.js
│
├─ Netlify CDN checks: .output/public/_nuxt/entry.abc123.js exists?
│  └─ YES → Serve langsung (200 OK, fast)
│
Request: https://yoursite.netlify.app/
│
├─ Netlify CDN checks: .output/public/index.html exists?
│  └─ NO → Forward ke /.netlify/functions/server
│     └─ Nitro SSR render → HTML response
│
Request: https://yoursite.netlify.app/api/money-books
│
├─ Match redirect rule /api/* → /.netlify/functions/server
│  └─ Nitro handler → API response
```

---

## 🚨 Kesalahan Umum & Cara Menghindarinya

### ❌ Kesalahan #1: Publish Directory Salah

**Gejala**: Semua file 404 (CSS, JS, HTML)

**Penyebab**:
```toml
# ❌ SALAH
publish = ".nuxt/dist/client"  # Ini untuk Nuxt 2/3 tanpa Nitro preset

# ✅ BENAR
publish = ".output/public"     # Nitro preset standar
```

### ❌ Kesalahan #2: Set Functions Directory Manual

**Gejala**: Function tidak deploy atau double-deploy

**Penyebab**:
```toml
# ❌ JANGAN ini
[functions]
  directory = ".netlify/functions"  # Conflict dengan Nitro auto-detect

# ✅ BENAR
# (TIDAK ADA [functions] section sama sekali)
```

### ❌ Kesalahan #3: Redirect Force = True untuk Aset

**Gejala**: CDN tidak serve aset, semua lewat function (lambat)

**Penyebab**:
```toml
# ❌ SALAH
[[redirects]]
  from = "/_nuxt/*"
  to = "/.netlify/functions/server"
  status = 200
  force = true  # Paksa semua lewat function, abaikan file di CDN

# ✅ BENAR
[[redirects]]
  from = "/_nuxt/*"
  to = "/_nuxt/:splat"
  status = 200
  force = false  # Atau hapus, default false
```

### ❌ Kesalahan #4: Ubah buildAssetsDir

**Gejala**: 404 di `/_nuxt/*`, tapi file ada di `/assets/*` atau path lain

**Penyebab**:
```ts
// ❌ JANGAN ini di nuxt.config.ts
export default defineNuxtConfig({
  app: {
    buildAssetsDir: '/assets/'  // Ubah default /_nuxt/
  }
})

// ✅ BENAR
// (JANGAN set buildAssetsDir, biarkan default)
```

### ❌ Kesalahan #5: File `_redirects` di `/public`

**Gejala**: Redirect tidak jalan atau conflict

**Penyebab**:
- File `public/_redirects` di-copy ke `.output/public/_redirects`
- **Netlify prioritas**: `_redirects` file > `netlify.toml` redirects
- Bisa conflict dengan Nitro routing

**Solusi**:
```bash
# Cek dan hapus jika ada
rm -f public/_redirects
rm -f public/_headers

# Gunakan netlify.toml saja untuk redirects/headers
```

---

## 🧪 Test Lokal vs Netlify

### Preview Lokal

```bash
# Build + preview
npm run build
npm run preview

# Buka http://localhost:3000
# Nitro development server mensimulasikan Netlify environment
```

**CATATAN**: Lokal preview tidak 100% sama dengan Netlify production karena:
- Lokal: Nitro standalone server
- Netlify: Nitro sebagai Netlify Function + CDN

### Test Production-Like Lokal

```bash
# Gunakan Netlify CLI
npm install -g netlify-cli

# Test deploy dry-run
netlify deploy --dry-run --dir=.output/public --functions=.output/server

# Deploy ke preview branch
netlify deploy --dir=.output/public --functions=.output/server
```

---

## 📊 Monitoring & Performance

### Cold Start Optimization

Netlify Functions punya "cold start" (startup delay) ~500ms-2s untuk first request.

**Tips optimasi**:
1. **Minimize dependencies**: Hanya import yang dipakai di server
2. **Tree-shaking**: Vite otomatis, pastikan `type: "module"` di package.json
3. **Lazy load**: Gunakan dynamic import untuk route besar

```ts
// ❌ Hindari import besar di server global scope
import * as allOfVuetify from 'vuetify'

// ✅ Import spesifik atau lazy
import { VBtn } from 'vuetify/components'
```

### Bundle Size Check

```bash
# Cek ukuran server function
du -sh .output/server/

# Target: < 10 MB (termasuk node_modules)
# Jika > 20 MB: periksa dependencies yang kebundel
```

---

## 🔐 Compatibility Notes

### Clerk Auth
- ✅ **SSR safe**: Clerk SDK support server-side rendering
- ✅ **Function environment**: Berjalan di Netlify Function (Node.js)
- ⚠️ **Middleware**: Pastikan `middleware/auth.ts` dan `server/middleware/auth.ts` tidak conflict

### Neon Database
- ✅ **Serverless friendly**: `@neondatabase/serverless` designed untuk edge/function
- ✅ **Connection pooling**: Otomatis di Neon
- ⚠️ **Cold start**: Connection setup ~100-300ms di cold start

### Vuetify
- ✅ **SSR support**: Vuetify 3 full SSR
- ⚠️ **Bundle size**: Treeshake dengan import spesifik
- ⚠️ **CSS**: Pastikan `vuetify/styles` di `css` array nuxt.config.ts

---

## 🎯 Summary: Apa yang Tidak Boleh Diubah

| Item | Status | Catatan |
|------|--------|---------|
| `nitro.preset` | ✅ Tetap `'netlify'` | Jangan ubah ke 'node-server' atau lainnya |
| `ssr` | ✅ Tetap `true` | Kecuali mau full static (SPA) |
| `app.buildAssetsDir` | ✅ Jangan set | Biarkan default `/_nuxt/` |
| `app.baseURL` | ✅ Jangan set | Biarkan default `/` |
| Publish directory | ✅ Harus `.output/public` | Jangan ubah di UI |
| Functions directory | ✅ Harus kosong di UI | Auto-detect |
| NODE_VERSION | ✅ Set 20 di netlify.toml | Jangan ubah di UI (akan di-override) |

---

## ✅ Checklist Akhir Sebelum Deploy

- [ ] `netlify.toml` → `publish = ".output/public"`
- [ ] `nuxt.config.ts` → `nitro.preset = 'netlify'`
- [ ] Netlify UI → Functions directory **KOSONG**
- [ ] Environment variables sudah diset di Netlify UI
- [ ] Tidak ada `_redirects` atau `_headers` di `/public`
- [ ] Build lokal sukses: `npm run build && ls .output/public/_nuxt/`
- [ ] Preview lokal jalan: `npm run preview`
