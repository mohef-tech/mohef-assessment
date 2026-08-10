1. Buka Docker Desktop & start database
   Buka Docker Desktop, pastikan status "Engine running" (gak perlu klik Start manual di container list — langsung lewat terminal aja lebih pasti). Dari folder deployments: docker compose up -d postgres redis

2. Jalankan backend (Go)
   Dari apps/backend: DB_HOST=localhost go run cmd/server/main.go. Kalau muncul error "address already in use", berarti ada proses lama nyangkut — jalankan dulu lsof -ti:8080 | xargs kill -9, baru ulangi.

3. Jalankan frontend (Next.js)
   Dari apps/frontend, di terminal terpisah: npm run dev. Buka http://localhost:3000.

4. Selesai kerja: matikan semua
   Ctrl+C di kedua terminal (backend & frontend). Data Postgres tetap aman tersimpan meski container dimatikan — opsional: docker compose down dari deployments kalau mau bersih-bersih total.
