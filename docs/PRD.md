# Product Requirements Document (PRD)
## Assessment Platform

**Version:** 1.1 (MVP – Final)
**Status:** Final
**Author:** Product & Engineering Team
**Project Type:** Web Application
**Architecture:** Modular Monolith + Hub & Node (Offline-Tolerant)
**Target Release:** Phase 1 (MVP)

### Revision History

| Versi | Perubahan |
|---|---|
| 1.0 | Draft awal |
| 1.1 | Offline Synchronization (Hub & Node) dipindah dari Non-Goal ke MVP scope; target concurrency dikembalikan ke ~100 peserta/Node; Question Randomization dan Question Versioning dipindah dari Phase 2/Non-Goal ke MVP scope; Monorepo tooling dispesifikkan (Makefile + Docker Compose); High-Level Architecture diperbarui mengikuti model Hub & Node |

---

## 1. Executive Summary

Assessment Platform adalah aplikasi berbasis web untuk menyelenggarakan ujian atau assessment secara digital. Versi pertama (MVP) difokuskan pada kebutuhan Computer Based Test (CBT) dengan soal pilihan ganda.

Platform dirancang menggunakan arsitektur **Modular Monolith** agar mudah dikembangkan menjadi platform assessment yang lebih besar tanpa perubahan arsitektur signifikan. Sejak MVP, platform juga mengadopsi pola **Hub & Node**: setiap lokasi ujian (Node) dapat beroperasi secara lokal tanpa bergantung pada koneksi internet yang stabil selama ujian berlangsung, dan menyinkronkan data ke server pusat (Hub) saat koneksi tersedia — terinspirasi dari kebutuhan nyata di lapangan (mis. sistem CAT BKN).

Walaupun MVP hanya mendukung satu organisasi, desain sistem tetap memperhatikan modularitas sehingga di masa depan dapat berkembang menjadi Multi Organization dan Software as a Service (SaaS).

## 2. Product Vision

Membangun platform assessment modern yang:
- Mudah digunakan
- Aman
- Cepat
- Stabil
- Modular
- Tetap dapat berjalan meski koneksi internet di lokasi ujian tidak stabil
- Siap berkembang menjadi berbagai jenis assessment

## 3. Product Goals

**Tujuan Utama**
- Membuat assessment secara online
- Mengelola bank soal (termasuk riwayat versi)
- Mengelola peserta
- Menjalankan ujian secara aman, termasuk di lokasi dengan koneksi internet terbatas
- Menghitung nilai otomatis
- Menampilkan hasil
- Menghasilkan laporan

**Tujuan Engineering**
- Clean Architecture
- Modular Monolith
- Offline-Tolerant (Hub & Node)
- REST API
- Docker Ready
- CI/CD Ready
- Production Ready
- High Code Quality

## 4. Non-Goals (MVP)

Fitur berikut tidak termasuk dalam versi pertama:
- Essay
- Coding Test
- Audio Question
- Video Question
- AI Scoring
- Multi Organization
- SaaS Billing
- Payment Gateway
- Mobile App
- Kubernetes Deployment
- Real-time Monitoring Dashboard

## 5. Target Users

**Administrator**
Bertanggung jawab mengelola sistem.
Hak akses: mengelola user, mengelola bank soal, mengelola assessment, melihat hasil, mengelola konfigurasi.

**Operator**
Mengelola pelaksanaan assessment.
Hak akses: membuat assessment, mengatur jadwal, mengelola peserta, melihat progress.

**Peserta**
Mengikuti assessment.
Hak akses: login, melihat assessment, mengerjakan assessment, melihat hasil (jika diizinkan).

## 6. Functional Requirements

### Authentication
- Login
- Logout
- Refresh Token
- Change Password
- Profile

### User Management
Administrator dapat: tambah user, edit user, nonaktifkan user, reset password.

### Participant Management
Operator dapat: tambah peserta, import peserta, edit peserta, nonaktifkan peserta.

### Question Bank
Operator dapat: membuat bank soal, mengelompokkan soal, menambah soal, mengedit soal, menghapus soal.

**Question Versioning:** Soal yang sudah digunakan dalam assessment yang telah dipublikasikan tidak dapat diedit langsung — perubahan menghasilkan versi baru dari soal tersebut. Riwayat versi tersimpan untuk keperluan audit.

### Question
MVP mendukung Multiple Choice. Setiap soal memiliki:
- Pertanyaan
- 4–5 pilihan jawaban
- Satu jawaban benar
- Bobot nilai

### Assessment
Administrator dapat: membuat assessment, menentukan durasi, menentukan jumlah soal, menentukan jadwal, menentukan peserta, menentukan passing grade, publish assessment.

### Assessment Session
Peserta dapat: memulai assessment, menjawab soal, menyimpan jawaban otomatis, submit.

**Question Randomization:** Urutan soal dan urutan pilihan jawaban diacak secara independen untuk setiap peserta guna mencegah kecurangan antar-peserta.

### Scoring
Sistem menghitung: jawaban benar, jawaban salah, nilai akhir, status lulus/tidak.

### Reporting
Administrator dapat melihat: daftar peserta, nilai, ranking, rekap assessment.

### Offline Synchronization (Hub & Node)
- Node dapat beroperasi secara mandiri (soal, peserta, jadwal, dan sesi ujian tersimpan lokal) tanpa memerlukan koneksi internet stabil selama ujian berlangsung.
- Sinkronisasi data master (soal, peserta, jadwal) dari Hub ke Node dilakukan sebelum assessment dimulai, saat koneksi tersedia.
- Sinkronisasi hasil (jawaban, nilai, log) dari Node ke Hub dilakukan setelah assessment selesai atau saat koneksi kembali tersedia.
- Sistem menyediakan sync-queue dengan mekanisme retry jika proses sinkronisasi gagal.

## 7. Non-Functional Requirements

**Performance**
- Response API < 500 ms (rata-rata)
- Mendukung minimal 100 peserta aktif secara bersamaan per Node pada target infrastruktur MVP
- Autosave jawaban maksimal setiap 15 detik atau saat ada perubahan jawaban

**Security**
- JWT Access Token
- Refresh Token
- HTTP-only Cookie
- CSRF Protection
- Password Hashing (Argon2id atau bcrypt)
- Rate Limiting
- Audit Log
- HTTPS pada lingkungan produksi

**Availability**
- Target uptime: 99% (Hub)
- Node tetap dapat melayani ujian meski Hub/internet tidak tersedia

**Maintainability**
- Modular
- Clean Code
- Unit Test
- API Documentation

## 8. Business Rules

- Peserta hanya dapat mengikuti assessment yang telah dipublikasikan.
- Assessment memiliki waktu mulai dan waktu selesai.
- Peserta hanya dapat memiliki satu sesi aktif untuk setiap assessment.
- Assessment otomatis berakhir ketika waktu habis.
- Jawaban terakhir yang tersimpan digunakan sebagai jawaban final apabila waktu habis.
- Nilai dihitung otomatis ketika assessment selesai.
- Administrator dapat menentukan apakah hasil langsung ditampilkan atau disembunyikan sampai waktu tertentu.
- Setiap Node wajib menyinkronkan data master (soal, peserta, jadwal) dari Hub sebelum assessment dapat dimulai di Node tersebut.
- Hasil assessment yang dikerjakan di Node dianggap final di level pusat setelah berhasil disinkronkan ke Hub.
- Soal yang telah dipakai pada assessment yang dipublikasikan tidak dapat diedit langsung; perubahan menghasilkan versi baru.

## 9. User Flow

**Administrator**
```
Login
  ↓
Dashboard
  ↓
Question Bank
  ↓
Assessment
  ↓
Publish
  ↓
Sinkronisasi ke Node
  ↓
(pasca ujian) Sinkronisasi hasil dari Node
  ↓
Result
```

**Peserta**
```
Login (di Node)
  ↓
Dashboard
  ↓
Assessment
  ↓
Start
  ↓
Answer Questions (soal & opsi teracak)
  ↓
Submit
  ↓
Finish
```

## 10. Module List

1. Authentication
2. User Management
3. Participant Management
4. Question Bank
5. Question Management (termasuk Versioning)
6. Assessment Management
7. Assessment Session (termasuk Randomization)
8. Submission
9. Scoring
10. Reporting
11. Audit Log
12. Synchronization (Hub ↔ Node)
13. System Configuration

## 11. Technology Stack

**Frontend**
- Next.js (Static Export)
- TypeScript
- Tailwind CSS

**Backend**
- Golang
- Gin Framework

**Database**
- PostgreSQL (masing-masing Node memiliki instance lokal; Hub memiliki instance pusat)

**Cache**
- Redis (per Node)

**Storage**
- StorageProvider Interface (implementasi file storage ditunda — MVP hanya soal berbasis teks)

**Authentication**
- JWT
- Refresh Token
- HTTP-only Cookie
- CSRF Protection

**Deployment**
- Docker Compose (Node maupun Hub)

**Repository**
- Monorepo

**Monorepo Management**
- Makefile sebagai entry point tunggal: `make dev`, `make build`, `make test`, `make lint`
- Struktur:
  ```
  /apps
    /backend        (Go module — modular monolith)
    /frontend       (Next.js app)
  /deployments
    docker-compose.yml
    docker-compose.prod.yml
  /Makefile
  /.github/workflows
    backend-ci.yml
    frontend-ci.yml
  ```

**CI/CD**
- GitHub Actions, job terpisah untuk backend & frontend, dipicu berdasarkan `paths:` filter agar tidak rebuild semua bagian pada setiap perubahan

## 12. High-Level Architecture

```
                     ┌───────────────────────┐
                     │          HUB           │
                     │   (Pusat / Cloud)       │
                     │   PostgreSQL (Master)   │
                     └───────────▲─────────────┘
                                 │  Sinkronisasi
                                 │  (REST API, saat online)
                                 │
        ┌────────────────────────┴─────────────────────────┐
        │                        NODE                        │
        │              (Lokasi Ujian — Lokal/LAN)             │
        │                                                     │
        │   Browser (Peserta)                                 │
        │           │                                         │
        │           ▼                                         │
        │   Next.js Static App                                │
        │           │                                         │
        │   REST API (HTTPS, jaringan lokal)                  │
        │           │                                         │
        │           ▼                                         │
        │   Go (Gin Backend) — Modular Monolith               │
        │           │                                         │
        │   ┌───────┴────────┐                                │
        │   ▼                ▼                                │
        │ PostgreSQL       Redis                               │
        │ (Local)         (Local)                              │
        └─────────────────────────────────────────────────────┘
```

## 13. Success Metrics (MVP)

- Administrator dapat membuat assessment tanpa bantuan developer.
- Peserta dapat menyelesaikan assessment tanpa kehilangan jawaban, termasuk saat koneksi internet di lokasi ujian terputus.
- Node dapat menjalankan ujian secara penuh secara lokal tanpa koneksi internet, dan berhasil menyinkronkan hasil ke Hub setelah koneksi tersedia kembali.
- Soal dan urutan opsi jawaban teracak berbeda untuk setiap peserta.
- Nilai dihitung otomatis dengan benar.
- Laporan hasil dapat ditampilkan dan diekspor.
- Aplikasi (Node maupun Hub) dapat dijalankan melalui Docker Compose dengan satu perintah.

## 14. Roadmap Setelah MVP

**Phase 2**
- Essay
- Import soal Excel
- Timer per section
- Export PDF & Excel
- Dashboard statistik

**Phase 3**
- Multi Organization
- Media (gambar, audio, video)
- API publik
- Mobile App

**Phase 4**
- SaaS
- Payment
- Plugin System
- AI Assisted Question Generator
- Coding Assessment
- Live Proctoring
- Kubernetes Deployment
