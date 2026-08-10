# Progress Notes — mohef-assessment

## Backend — Selesai ✅

- Project skeleton (Go + Gin) + Docker Compose (Postgres, Redis)
- Auth module: register, login, refresh token (HTTP-only cookie), logout, CSRF protection
- User Management: CRUD user + role-based access control (RequireAuth, RequireRole)
- CORS dikonfigurasi untuk konsumsi dari Next.js (`localhost:3000`)

## Backend — Belum (urutan lanjutan)

1. Question Bank & Question Management — CRUD soal + versioning✅
2. Participant Management — CRUD peserta + import
3. Assessment Management — buat assessment, jadwal, passing grade, publish
4. Assessment Session — start, jawab, autosave, randomization, submit
5. Scoring & Submission — hitung nilai otomatis
6. Reporting — daftar peserta, nilai, ranking
7. Audit Log — cross-cutting
8. Synchronization (Hub ↔ Node) — paling akhir, paling kompleks

## Frontend (Next.js) — Rencana begitu pindah

1. Setup project: `create-next-app` + TypeScript + Tailwind, struktur `apps/frontend` ✅
2. Auth flow: halaman Login, simpan access token (in-memory/state — bukan localStorage), handle refresh otomatis✅
3. Layout dasar: proteksi route (redirect ke login kalau belum auth), baca role dari token buat guard halaman admin✅
4. Dashboard admin: list user (`GET /users`), form update/deactivate/reset password — konsumsi endpoint yang sudah ada✅
5. Setelah dashboard admin jalan, gantian balik ke backend untuk modul berikutnya (Question Bank), lalu bikin UI-nya menyusul ->

## Catatan

- Setiap pindah balik backend↔frontend, checkpoint di sini di-update biar gak hilang jejak.
  EOF

Dokumentasi dan update Progress : https://docs.google.com/document/d/1XBg8vgV8GWM4mctQ7TmFj7hMg4kcmmvqSlorP7L8EEg/edit?usp=sharing
