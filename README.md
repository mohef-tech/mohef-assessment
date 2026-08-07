# Mohef Assessment

Computer-Based Test (CBT) / Assessment Platform — sistem ujian digital yang bisa berjalan secara **offline-tolerant** di lokasi ujian (Node) dan menyinkronkan data ke server pusat (Hub) saat koneksi tersedia. Terinspirasi dari konsep CAT BKN, dengan skala dan kompleksitas yang disederhanakan.

## Status

🚧 MVP — dalam pengembangan aktif. Lihat [docs/PRD.md](docs/PRD.md) untuk spesifikasi lengkap.

## Fitur MVP

- Manajemen bank soal (multiple choice, dengan versioning)
- Manajemen peserta & assessment
- Sesi ujian dengan randomisasi soal & opsi jawaban
- Autosave jawaban otomatis
- Penilaian otomatis & pelaporan hasil
- **Hub & Node**: ujian tetap bisa berjalan tanpa koneksi internet stabil, sinkron ke pusat setelahnya

## Arsitektur

- **Pattern**: Modular Monolith + Hub & Node (offline-tolerant)
- **Backend**: Golang (Gin)
- **Frontend**: Next.js (Static Export) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: JWT + Refresh Token + HTTP-only Cookie

## Struktur Project

apps/
backend/ → Go modular monolith
frontend/ → Next.js app
deployments/ → Docker Compose
docs/ → PRD & dokumentasi teknis

## Getting Started

```bash
cd deployments
docker compose up --build
curl http://localhost:8080/health
```

## Roadmap

Lihat bagian Roadmap di [docs/PRD.md](docs/PRD.md) untuk Phase 2–4.
EOF
