# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), phiên bản theo [SemVer](https://semver.org/).

## [Unreleased]

### Added

- Khung monorepo: `backend/` (Express 5, TypeORM, PostgreSQL), `frontend/` (React 19, Vite, Tailwind 4), `infra/` (docker + nginx), `docs/`.
- Backend: đăng ký/đăng nhập, Google OAuth (tuỳ chọn), 2FA, email, rate limit, Swagger `/docs`.
- Backend: `CryptoService` (AES-256-GCM) và module `hosts` (CRUD, secret được mã hoá, không bao giờ trả về).
- Frontend: đăng nhập/đăng ký/2FA/cài đặt và trang Hosts.
- `infra/docker/docker-compose.yml` (`db`, `api`, `web`) và `docker-compose.dev.yml` (PostgreSQL + SSH thử).
- CI (lint, type-check, test, build, Docker build) và workflow release lên GHCR.
- LICENSE (MIT), README song ngữ, CONTRIBUTING, SECURITY, issue/PR template.
