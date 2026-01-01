# Nuxt 4 SSR Netlify Deployment - Checklist Verifikasi

## 1️⃣ Post-Build Verification (Lokal)

Setelah menjalankan `npm run build`, periksa struktur output:

### A. Verifikasi Struktur Folder `.output/`
```bash
# Cek apakah folder .output/ ada
ls -la .output/

# Harus menampilkan:
# .output/
# ├── public/          # ← Aset client (CDN)
# │   ├── _nuxt/       # ← CSS, JS, chunks
# │   ├── favicon.ico  # ← File dari /public
# │   └── robots.txt
# └── server/          # ← Fungsi SSR Nitro
#     └── (chunks, node_modules, index.mjs)
```

### B. Cek Aset Client Bundle
```bash
# Periksa ada file di _nuxt/
ls -lah .output/public/_nuxt/

# Harus ada file seperti:
# - entry.{hash}.js
# - entry.{hash}.css
# - {component}.{hash}.js
# Total minimal 3-10 file tergantung app size

# Verifikasi ukuran file (tidak boleh 0 bytes)
du -sh .output/public/_nuxt/*
```

### C. Verifikasi File Public Tercopy
```bash
# Cek file dari /public sudah tercopy
ls -la .output/public/

# Harus ada:
# - favicon.ico
# - robots.txt
# - (file lain yang Anda taruh di /public)
```

### D. Verifikasi Fungsi SSR Nitro
```bash
# Cek server function ada
ls -la .output/server/

# Harus ada:
# - index.mjs (entry point Nitro)
# - chunks/ (server chunks)
# - node_modules/ (dependencies)
```

### E. Test Preview Lokal
```bash
# Preview build lokal dengan Nitro
npm run preview

# Buka http://localhost:3000
# Periksa di Browser DevTools Network:
# - /_nuxt/entry.{hash}.css status 200
# - /_nuxt/entry.{hash}.js status 200
# - /favicon.ico status 200
# - / (halaman utama) status 200
```

---

## 2️⃣ Verifikasi di Netlify CI/CD

### A. Build Logs
Setelah deploy, cek di Netlify Dashboard → Deploy → Build logs:

```
✓ Build berhasil
✓ Deploy Preview: https://xxx.netlify.app
```

Pastikan:
- ✅ `npm run build` selesai tanpa error
- ✅ "Functions bundled" muncul (berarti Nitro function terdeteksi)
- ✅ Tidak ada warning "No publish directory found"

### B. Cek Functions Tab
Di Netlify Dashboard → Functions:

- ✅ Harus ada 1 function bernama `server` atau `___netlify-handler`
- ✅ Runtime: Node.js 20.x
- ✅ Size: biasanya 1-5 MB tergantung dependencies

### C. Test URL Deploy
```bash
# Ganti dengan URL Netlify Anda
DEPLOY_URL="https://your-site.netlify.app"

# Test aset client
curl -I "$DEPLOY_URL/_nuxt/entry.{hash}.css"
# Harapan: HTTP 200, content-type: text/css

curl -I "$DEPLOY_URL/favicon.ico"
# Harapan: HTTP 200, content-type: image/x-icon

# Test route SSR
curl -I "$DEPLOY_URL/"
# Harapan: HTTP 200, content-type: text/html

curl -I "$DEPLOY_URL/dashboard"
# Harapan: HTTP 200, content-type: text/html
```

---

## 3️⃣ Checklist Konfigurasi

### ✅ netlify.toml
- [x] `publish = ".output/public"`
- [x] `command = "npm run build"`
- [x] `NODE_VERSION = "20"`
- [x] **TIDAK ADA** `functions` key (Nitro auto-detect)
- [x] Redirect `/_nuxt/*` dengan status 200 (optional, tapi aman)
- [x] Redirect `/*` ke `/.netlify/functions/server` status 200

### ✅ nuxt.config.ts
- [x] `nitro.preset = 'netlify'`
- [x] `ssr: true`
- [x] **JANGAN** set `app.baseURL` (biarkan default `/`)
- [x] **JANGAN** set `app.buildAssetsDir` (biarkan default `/_nuxt/`)

### ✅ Netlify UI Settings
- [x] Build command: `npm run build`
- [x] Publish directory: `.output/public`
- [x] Functions directory: **KOSONGKAN** (auto-detect)
- [x] Node version: 20 (dari netlify.toml)

---

## 4️⃣ Common Issues Checklist

| Issue | Check | Solution |
|-------|-------|----------|
| `/_nuxt/*` 404 | `ls .output/public/_nuxt/` kosong? | Periksa build error, coba `rm -rf .output .nuxt node_modules && pnpm install && pnpm build` |
| `/favicon.ico` 404 | File tidak ada di `.output/public/`? | Pastikan file di `/public` di root project, bukan di `/server/public` |
| Route `/` 404 | Function tidak deploy? | Cek Netlify Functions tab, pastikan `server` function ada |
| CSS tidak apply | File CSS load tapi tidak apply? | Periksa CSP headers, vuetify config |
| Function timeout | SSR lambat? | Periksa cold start, optimize dependencies |

---

## 5️⃣ Quick Diagnosis Commands

```bash
# Lokal: Cek build output lengkap
npm run build && tree -L 3 .output/

# Lokal: Cek ukuran total
du -sh .output/public/
du -sh .output/server/

# Remote: Download dan inspect deploy artifact
# (Gunakan Netlify CLI)
netlify deploy --dry-run --dir=.output/public
```

---

## ✅ Success Criteria

Deploy dianggap **SUKSES** jika:

1. ✅ Build tanpa error di Netlify CI
2. ✅ `.output/public/_nuxt/` berisi minimal 3+ file JS/CSS
3. ✅ File di `/public` muncul di `.output/public/`
4. ✅ Function `server` terdaftar di Netlify Functions
5. ✅ Browser DevTools Network: semua request 200
6. ✅ SSR hydration berhasil (tidak ada client-side re-render penuh)
7. ✅ Clerk auth flow bekerja (login/logout)
8. ✅ API `/api/*` response 200 dengan data Neon DB

---

## 🐛 Jika Masih 404 Setelah Fix

Kirim data berikut:
1. Output dari `ls -lah .output/public/_nuxt/` (lokal build)
2. Contoh URL asset yang 404 (e.g., `https://xxx.netlify.app/_nuxt/entry.abc123.css`)
3. Screenshot Browser DevTools Network tab
4. Netlify deploy log (bagian "Bundling functions")
