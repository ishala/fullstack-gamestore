# 🎮 Game Store App

Aplikasi ini menggabungkan data dari [**RAWG Video Games Database**](https://rawg.io/apidocs) dan [**CheapShark API**](https://apidocs.cheapshark.com/) untuk menampilkan katalog game beserta perbandingan harga global vs harga toko.

**Stack:** React JS (Frontend) · FastAPI (Backend) · PostgreSQL · Redis · Celery

---

## 📋 Prasyarat

Pastikan sudah terinstall di mesin kamu:

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) & Docker Compose
- [Python 3.12+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/) & npm

---

## 1. Git Clone

```bash
git clone https://github.com/ishala/fullstack-gamestore.git
```

Setelah clone, pastikan file `.env` sudah ada di root project. Jika belum, buat berdasarkan contoh berikut:

```env
ENVIRONMENT=dev
RAWG_API_KEY=your_rawg_api_key_here

# PostgreSQL
POSTGRES_USER=game_store_user
POSTGRES_PASSWORD=game_store_pass
POSTGRES_DB=game_store_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql+asyncpg://game_store_user:game_store_pass@localhost:5432/game_store_db

# Redis
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379/0

# Backend & Frontend
BACKEND_PORT=8000
FRONTEND_PORT=3000
VITE_API_BASE_URL=http://localhost:8000
```

> **Catatan:** RAWG API Key bisa didapat gratis di [rawg.io/apidocs](https://rawg.io/apidocs)

---

## 2. Jalankan Docker Compose

Docker Compose digunakan untuk menjalankan **PostgreSQL** dan **Redis** sebagai infrastruktur aplikasi.

```bash
docker compose up -d
```

Verifikasi container berjalan:

```bash
docker compose ps
```

Output yang diharapkan:

```
NAME                    STATUS
game_store_postgres     running (healthy)
game_store_redis        running (healthy)
```

---

## 3. Setup & Jalankan Aplikasi (3 Terminal)

### 🖥️ Terminal 1 — Backend (FastAPI)

```bash
cd be-dashboard

# Buat virtual environment (hanya pertama kali)
python -m venv venv

# Aktifkan virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies (hanya pertama kali)
pip install -r requirements.txt

# Jalankan migrasi database (hanya pertama kali atau setelah ada migration baru)
alembic upgrade head

# Jalankan server FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server berjalan di: `http://localhost:8000`  
API Docs tersedia di: `http://localhost:8000/docs`

---

### 🔄 Terminal 2 — Celery Worker

Celery diperlukan untuk menjalankan task sync data dari RAWG + CheapShark secara background.

```bash
cd be-dashboard

# Aktifkan virtual environment yang sama
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Jalankan Celery worker
celery -A app.celery_app:celery worker --loglevel=info --concurrency=2
```

Celery siap menerima task ketika muncul log:
```
[celery@hostname] ready.
```

---

### 🌐 Terminal 3 — Frontend (React)

```bash
cd fe-dashboard

# Install dependencies (hanya pertama kali)
npm install

# Jalankan development server
npm run dev
```

Aplikasi berjalan di: `http://localhost:5173`

---
## 4. Jalankan Seeder (Opsional)

Seeder digunakan untuk mengisi data **sales** secara otomatis berdasarkan game yang sudah ada di database. Berguna untuk testing atau demo tanpa perlu input manual satu per satu di halaman My Store.

> ⚠️ **Prasyarat:** Pastikan sudah menjalankan **Sync Data** terlebih dahulu (via tombol di UI atau API), karena seeder membaca data dari tabel `games`.

Jalankan di Terminal 1 (Backend) atau terminal baru dengan venv aktif:

```bash
cd be-dashboard

# Aktifkan virtual environment jika belum aktif
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Seed semua game yang ada di database
python -m app.seeders.seed_sales

# Atau batasi jumlah game yang di-seed (misal hanya 10 game pertama)
python -m app.seeders.seed_sales --max-games 10
```

Output yang diharapkan:

```
🎮 Ditemukan 40 game, mulai seeding sales...

  ✅ Seed  — Grand Theft Auto V | 2x sale (ref: $14.99)
  ✅ Seed  — Elden Ring | 1x sale (ref: $39.99)
  ✅ Seed  — Cyberpunk 2077 | 3x sale (ref: $19.99)
  ⏭️  Skip  — Portal 2 (sudah ada 2 sale)
  ...

──────────────────────────────────────────────────
✅ Seeding selesai!
   Sales inserted : 67
   Games skipped  : 1 (sudah ada datanya)
──────────────────────────────────────────────────
```

**Catatan perilaku seeder:**
- Seeder bersifat **idempotent** — game yang sudah punya data sales akan di-skip, tidak akan duplikat
- Harga toko (`our_price`) dihitung otomatis berdasarkan harga referensi CheapShark dengan variasi rasio realistis
- Jika game tidak punya data harga dari CheapShark, harga di-generate berdasarkan genre game
- Setiap game mendapatkan 1–3 entri sales secara acak

---

## 5. Alur Penggunaan Aplikasi

### 📡 Step 1 — Sync Data Game

Halaman **Games** (`/`) adalah titik awal. Database awalnya kosong, jadi langkah pertama adalah sync data dari RAWG + CheapShark.

1. Buka `http://localhost:5173`
2. Klik tombol **Sync Data** di pojok kanan atas
3. Progress sync akan muncul: `Syncing... X/40 game`
4. Setelah selesai, tabel akan otomatis terisi dengan data game beserta harga global dari CheapShark
5. Informasi **Last sync** akan diperbarui di samping tombol Sync

> Sync mengambil 40 game terbaru dari RAWG, lalu mencocokkan harga dari CheapShark untuk setiap game.

---

### 🛒 Step 2 — Tambah Game ke Toko (My Store)

Halaman **My Store** (`/my-store`) digunakan untuk mengelola game yang dijual di toko beserta harga jualnya.

1. Buka halaman **My Store** dari sidebar
2. Di bagian form atas, ketik nama game di kolom **Nama Game**
3. Dropdown akan muncul menampilkan hasil pencarian dari database (game yang belum ada di toko)
4. Pilih game dari dropdown
5. Isi **Harga Toko** (dalam USD)
6. Klik **+ Tambah ke Toko**
7. Game akan muncul di tabel di bawahnya

---

### ✏️ Step 3 — Edit atau Hapus Data

#### Di halaman Games (`/`)

Menampilkan seluruh katalog game hasil sync dari RAWG + CheapShark.

- **Hapus game:** Klik ikon 🗑️ di kolom Action → game dihapus dari database
- **Sort kolom:** Klik header kolom (Nama Game, Genre, Release Date, Price, Rating)
- **Filter:** Klik ikon filter (▽) di header kolom untuk filter per kolom
- **Search:** Ketik di kolom pencarian di kiri atas
- **Pagination:** Navigasi halaman di footer tabel (10 data per halaman)

#### Di halaman My Store (`/my-store`)

Menampilkan game yang sudah ditambahkan ke toko beserta harga jual.

- **Edit harga:** Klik ikon ✏️ → ubah harga → klik ✓ untuk menyimpan
- **Hapus dari toko:** Klik ikon 🗑️ → game dihapus dari daftar toko (data game di katalog utama tidak terpengaruh)
- **Sort kolom:** Klik header kolom (Nama Game, Genre, Store Price)

---

### 📊 Step 4 — Dashboard Analitik

Halaman **Dashboard** (`/dashboard`) menampilkan visualisasi data dalam dua mode.

#### Cara mengakses:
1. Klik menu **Dashboard** di sidebar
2. Pilih mode tampilan dari dropdown di kanan atas:
   - **🌐 Data Public** — analitik dari katalog game RAWG
   - **🛒 Data Sales** — analitik dari data toko

#### Filter tanggal:
- Gunakan filter **Date Range** untuk memfilter data berdasarkan rentang tanggal
- Default: 1 bulan terakhir
- Semua chart akan otomatis terupdate saat tanggal diubah

#### Konten Dashboard:

**Data Public:**
- Distribusi game per genre (Pie Chart)
- Jumlah game yang di-sync per tanggal (Column Chart)
- Rata-rata rating per genre

**Data Sales:**
- Selisih harga toko vs harga global per genre
- Jumlah sales per tanggal
- Tren harga toko

---

## 🔧 Tips & Troubleshooting

| Masalah | Solusi |
|---|---|
| Tabel kosong setelah buka aplikasi | Klik **Sync Data** untuk mengisi data pertama kali |
| Tombol Sync tidak merespons | Pastikan Celery worker (Terminal 2) sedang berjalan |
| Error koneksi database | Pastikan Docker Compose berjalan (`docker compose ps`) |
| Game tidak muncul di dropdown My Store | Game mungkin sudah ada di toko, atau coba keyword lain |
| Port 8000 sudah dipakai | Ubah `BACKEND_PORT` di `.env` dan sesuaikan `VITE_API_BASE_URL` |

---

## 📁 Struktur Folder

```
├── be-dashboard/        # FastAPI Backend
│   ├── app/
│   │   ├── routers/     # Endpoint API
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── crud/        # Database operations
│   │   ├── services/    # Business logic (sync)
│   │   └── tasks/       # Celery tasks
│   ├── alembic/         # Database migrations
│   └── requirements.txt
├── fe-dashboard/        # React Frontend
│   ├── src/
│   │   ├── pages/       # MainPage, MyStorePage, Dashboard
│   │   ├── components/  # TableBody, TableHeader, filters, dll
│   │   ├── hooks/       # useSort, useFilter, usePagination
│   │   ├── layouts/     # MainLayout, MainHeader, dll
│   │   └── utils/       # network-data.js (API calls)
│   └── package.json
├── docker-compose.yml   # PostgreSQL + Redis
└── .env                 # Environment variables
```