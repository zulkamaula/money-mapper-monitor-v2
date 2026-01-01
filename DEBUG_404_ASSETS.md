# Debug Guide: 404 Aset `/_nuxt/*`

## 🔍 Systematic Debugging Workflow

Jika setelah deploy masih ada 404 di `/_nuxt/*`, ikuti langkah berikut **secara berurutan**:

---

## 1️⃣ Verifikasi Build Logs di Netlify

### A. Buka Deploy Logs
1. Netlify Dashboard → Sites → [your-site]
2. Deploys → [latest deploy] → Deploy log
3. Cari section:
   ```
   ✓ Building Functions
   ✓ Bundling Functions
   ```

### B. Periksa Kesalahan Build

**Red flags** yang harus dicari:

```bash
# ❌ Error: Module not found
Error: Cannot find module 'vuetify'
# Fix: pnpm install, pastikan dependencies lengkap

# ❌ Warning: No publish directory
Warning: No publish directory found at .output/public
# Fix: Cek netlify.toml publish path

# ❌ Error: Nitro build failed
Error building Nitro preset
# Fix: Cek nuxt.config.ts, pastikan preset valid

# ❌ Missing function handler
Warning: No functions found
# Fix: Pastikan .output/server/index.mjs ada
```

### C. Cek Function Bundle

Di bagian bawah log, harus ada:

```
Functions bundled:
  - server (26.3 MB)
```

Jika **TIDAK ADA** ini, berarti Nitro function tidak terbundle → SSR tidak jalan.

---

## 2️⃣ Inspeksi Struktur Folder Output

### Lokal: Cek `.output/` Setelah Build

```bash
# Build ulang dari scratch
rm -rf .output .nuxt node_modules/.vite
npm run build

# Periksa struktur
tree -L 4 .output/

# Harapan:
# .output/
# ├── public/
# │   ├── _nuxt/
# │   │   ├── entry.{hash}.js
# │   │   ├── entry.{hash}.css
# │   │   └── (minimal 3+ files)
# │   ├── favicon.ico
# │   └── robots.txt
# └── server/
#     ├── index.mjs
#     └── chunks/
```

### Cek Ukuran File

```bash
# Periksa ada file beneran (bukan 0 bytes)
ls -lh .output/public/_nuxt/

# Output contoh:
# -rw-r--r--  1 user  staff   24K Jan  1 15:30 entry.abc123.js
# -rw-r--r--  1 user  staff   12K Jan  1 15:30 entry.abc123.css
```

**Red flags**:
- Folder `_nuxt/` kosong → Vite build gagal
- File 0 bytes → Build error tidak terdeteksi
- Tidak ada `.css` file → CSS extraction issue

---

## 3️⃣ Netlify Deploy Artifact Inspection

### Cara Download Deploy Artifact (Netlify CLI)

```bash
# Install Netlify CLI jika belum
npm install -g netlify-cli

# Login
netlify login

# Link site
cd /path/to/project
netlify link

# List deploys
netlify deploy:list

# Download specific deploy (ganti DEPLOY_ID)
netlify deploy:get DEPLOY_ID

# Atau lihat langsung di UI:
# Netlify Dashboard → Deploys → [deploy] → Download deploy
```

### Inspeksi File yang Di-Deploy

Setelah download, extract dan periksa:

```bash
# Extract deploy artifact
unzip deploy-XXXXX.zip -d deploy-inspect

# Cek struktur
ls -la deploy-inspect/

# Harus ada:
# - _nuxt/ folder dengan file JS/CSS
# - favicon.ico
# - robots.txt

# Jika _nuxt/ TIDAK ADA atau KOSONG:
# → Netlify publish directory salah
# → Periksa netlify.toml dan UI settings
```

---

## 4️⃣ Cek Cache Netlify

### Clear Build Cache

Cache lama bisa sebabkan file tidak terupdate. Clear dengan:

**Option 1: Via UI**
1. Netlify Dashboard → Site settings
2. Build & deploy → Build settings
3. Scroll ke bawah → **Clear build cache**
4. Trigger new deploy

**Option 2: Via netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = ".output/public"
  # Force fresh build
  ignore = "!*"  # Deploy setiap commit (hapus setelah test)
```

**Option 3: Manual Clear + Rebuild**
```bash
# Di Netlify Deploy trigger
# Centang: "Clear build cache and deploy site"
```

---

## 5️⃣ Deteksi Konflik `_redirects` di `/public`

### Masalah

File `/public/_redirects` akan di-copy ke `.output/public/_redirects`. Netlify prioritas:

1. `_redirects` file (highest)
2. `netlify.toml` redirects
3. Default behavior

Jika ada `/public/_redirects` yang salah, bisa override `netlify.toml`.

### Cara Cek

```bash
# Lokal: cek apakah file ini ada
ls -la public/_redirects
ls -la public/_headers

# Jika ADA, periksa isinya
cat public/_redirects

# Contoh SALAH yang block aset:
# /*  /.netlify/functions/server  200
# ↑ Ini akan redirect SEMUA termasuk /_nuxt/

# Contoh BENAR (atau hapus file):
# (kosong atau tidak ada file sama sekali)
```

### Fix

```bash
# Hapus file conflict
rm -f public/_redirects
rm -f public/_headers

# Gunakan HANYA netlify.toml untuk redirects
# (sudah diatur di netlify.toml yang baru)
```

---

## 6️⃣ Perbedaan Output Nuxt 3 vs Nuxt 4

### Nuxt 3 (tanpa Nitro preset)

```
.nuxt/
└── dist/
    ├── client/       # Client bundle
    │   └── _nuxt/
    └── server/       # Server bundle
```

**Publish**: `.nuxt/dist/client`

### Nuxt 4 dengan `nitro.preset = 'netlify'`

```
.output/              # ← Nitro unified output
├── public/           # Client bundle (CDN)
│   └── _nuxt/
└── server/           # SSR function
    └── index.mjs
```

**Publish**: `.output/public`

### Migration Issue

Jika upgrade dari Nuxt 3 → Nuxt 4 dan lupa ubah `publish` di netlify.toml:

```toml
# ❌ SALAH (Nuxt 3 path)
publish = ".nuxt/dist/client"

# ✅ BENAR (Nuxt 4 Nitro path)
publish = ".output/public"
```

**Gejala**: 404 semua aset, karena Netlify serve folder yang salah.

---

## 7️⃣ Browser DevTools Network Analysis

### Step-by-Step Debug

1. **Buka site di browser**
2. **F12 → Network tab**
3. **Hard refresh**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
4. **Filter**: `_nuxt`

### Analisis Response

#### Skenario 1: 404 Not Found

```
Request URL: https://yoursite.netlify.app/_nuxt/entry.abc123.js
Status: 404 Not Found
```

**Diagnosis**:
- File tidak ada di `.output/public/_nuxt/`
- Atau publish directory salah

**Action**:
```bash
# Lokal: verifikasi file ada
ls -la .output/public/_nuxt/entry.abc123.js

# Jika ADA lokal tapi 404 remote:
# → Netlify tidak deploy file ini
# → Cek .netlifyignore atau .gitignore

# Jika TIDAK ADA lokal:
# → Build issue, cek build logs
```

#### Skenario 2: 200 tapi Redirect Loop

```
Request URL: https://yoursite.netlify.app/_nuxt/entry.abc123.js
Status: 200 OK
Content-Type: text/html  ← ❌ SALAH (harusnya application/javascript)
Size: 2.5 kB  ← ❌ Terlalu kecil (harusnya 20-50 kB)
```

**Diagnosis**: File di-redirect ke fungsi SSR, bukan serve langsung dari CDN.

**Root cause**:
- Redirect rule salah di netlify.toml
- Atau `force = true` di redirect `/_nuxt/*`

**Fix**: Lihat netlify.toml yang sudah diperbaiki.

#### Skenario 3: 200 OK tapi CORS Error

```
Status: 200 OK
CORS policy: No 'Access-Control-Allow-Origin' header
```

**Diagnosis**: Asset dimuat tapi browser block karena CORS.

**Fix**: Tambahkan header di netlify.toml:
```toml
[[headers]]
  for = "/_nuxt/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

---

## 8️⃣ Check .gitignore vs .netlifyignore

### Masalah Umum

`.gitignore` men-exclude `.output/`, tapi Netlify build di server (bukan dari Git).

### Cara Cek

```bash
# Periksa .gitignore
cat .gitignore | grep output
# Output: .output  ← Ini OK (lokal dev tidak commit)

# Periksa .netlifyignore (jika ada)
cat .netlifyignore

# Jika BERISI:
# .output
# ↑ ❌ SALAH! Netlify akan ignore folder build
```

### Fix

```bash
# Hapus .netlifyignore atau kosongkan
rm .netlifyignore

# Atau edit agar tidak exclude .output
# .netlifyignore should NOT contain:
# - .output
# - .nuxt
# - dist
```

**PENTING**: `.netlifyignore` berbeda dari `.gitignore`. Netlify perlu `.output/` untuk deploy.

---

## 9️⃣ Netlify Function Logs

### Cek Real-Time Logs

```bash
# Via Netlify CLI
netlify functions:log

# Atau di UI:
# Netlify Dashboard → Functions → server → Logs
```

### Cari Error Pattern

```
# ❌ Module not found saat runtime
Error: Cannot find module '@neondatabase/serverless'
# Fix: Pastikan dependency di package.json, bukan devDependencies

# ❌ Clerk init error
ClerkError: Missing publishable key
# Fix: Set NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY di env vars

# ⚠️ Asset request masuk ke function (tidak seharusnya)
[Function] GET /_nuxt/entry.abc123.js
# Diagnosis: Redirect rule salah, aset tidak di-serve CDN
```

---

## 🔟 Advanced: X-Nf-Request-Id Debug

### Trace Request Path

Setiap request ke Netlify punya unique ID di header.

```bash
# Request dengan curl
curl -I https://yoursite.netlify.app/_nuxt/entry.abc123.js

# Response headers:
HTTP/2 404
x-nf-request-id: 01HXXX-xxx-xxx
```

### Hubungi Netlify Support (Jika Perlu)

Jika semua sudah benar tapi tetap 404, berikan ke support:
1. `x-nf-request-id` dari response header
2. Deploy ID dari UI
3. Screenshot struktur `.output/public/`

---

## ✅ Checklist Debug Cepat (5 Menit)

Jalankan command ini dan kirim hasilnya:

```bash
# 1. Verifikasi build output lokal
npm run build
tree -L 3 .output/ || ls -R .output/

# 2. Cek file aset ada
ls -lah .output/public/_nuxt/ | head -10

# 3. Cek publish directory di config
grep -n "publish" netlify.toml

# 4. Cek ada conflict file
ls -la public/_redirects public/_headers 2>/dev/null || echo "No conflict files"

# 5. Cek .netlifyignore
cat .netlifyignore 2>/dev/null || echo "No .netlifyignore"
```

---

## 📤 Info yang Dibutuhkan untuk Troubleshooting Lanjut

Jika masih 404 setelah semua langkah di atas, kirim:

1. **Output build lokal**:
   ```bash
   ls -lah .output/public/_nuxt/
   ```

2. **URL asset yang 404** (contoh):
   ```
   https://yoursite.netlify.app/_nuxt/entry.abc123.js
   ```

3. **Response header** (dari DevTools atau curl):
   ```bash
   curl -I https://yoursite.netlify.app/_nuxt/entry.abc123.js
   ```

4. **Netlify deploy log** (copy paste section "Bundling Functions")

5. **Screenshot Network tab** (browser DevTools, filter `_nuxt`)

Dengan info ini, kita bisa pinpoint exact issue.
