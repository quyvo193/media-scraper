# 🎬 Media Scraper

A high-performance web scraper for images and videos. Optimized for 1 CPU, 1GB RAM servers.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

- **Smart Scraping** - Auto-selects Cheerio (static) or Puppeteer (JS-heavy)
- **Background Processing** - Bull queue handles 5000+ concurrent requests
- **2-Layer Deduplication** - Queue and cache-level URL filtering
- **Dead Letter Queue** - Structured logging for failed jobs
- **Memory Optimized** - GC hints, browser restart, connection pooling

## 🚀 Quick Start

```bash
# Start services
docker-compose up -d

# Setup database (run from backend folder)
cd backend
npm install
npm run db:push
npm run prisma:seed
```

**URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Health: http://localhost:3001/health

**Login:** `admin` / `admin123`

## 📖 API Endpoints

All endpoints require Basic Auth except `/health`.

```bash
curl -u admin:admin123 http://localhost:3001/api/media
```

| Method | Endpoint                  | Description                    |
| ------ | ------------------------- | ------------------------------ |
| POST   | `/api/auth/login`         | Validate credentials           |
| GET    | `/api/auth/me`            | Get current user               |
| POST   | `/api/scrape`             | Submit URLs for scraping       |
| GET    | `/api/scrape/queue/stats` | Queue statistics               |
| GET    | `/api/jobs`               | List jobs (paginated)          |
| GET    | `/api/jobs/:id`           | Get job details                |
| GET    | `/api/media`              | List media (paginated, filter) |
| GET    | `/api/media/stats`        | Media statistics               |
| GET    | `/api/media/:id`          | Get media item                 |
| GET    | `/health`                 | Health check (no auth)         |

**Query params for `/api/media`:** `page`, `limit`, `type` (image/video), `search`

## 🔧 Configuration

| Variable              | Default     | Description                  |
| --------------------- | ----------- | ---------------------------- |
| `DATABASE_URL`        | -           | PostgreSQL connection string |
| `REDIS_HOST`          | `localhost` | Redis host                   |
| `REDIS_PORT`          | `6379`      | Redis port                   |
| `SCRAPER_CONCURRENCY` | `3`         | Parallel scrape jobs         |
| `SCRAPER_TIMEOUT`     | `30000`     | Timeout in ms                |

For 1GB RAM, add to DATABASE_URL: `?connection_limit=5&pool_timeout=10`

## 📁 Project Structure

```
momos/
├── backend/
│   ├── src/
│   │   ├── config/       # Environment, database, Redis
│   │   ├── middleware/   # Auth, validation, errors
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── scrapers/     # Cheerio & Puppeteer
│   │   ├── queue/        # Bull queue management
│   │   └── utils/        # Memory, cache
│   └── prisma/           # Database schema & migrations
├── frontend/
│   └── src/
│       ├── components/   # UI components
│       ├── contexts/     # Auth context
│       ├── lib/          # API client, hooks
│       └── pages/        # Page components
└── docker-compose.yml
```

## 🔄 Scraping Flow

```
POST /api/scrape → Dedupe within request
        ↓
Queue Manager → Skip: cached URLs, pending URLs
        ↓
Worker → Check cache → Scrape (Cheerio/Puppeteer) → Save to DB
        ↓
On permanent failure → Log to DLQ
```

## 📈 Optimizations

**Memory:** Puppeteer restart every 10 pages, GC hints, Prisma connection pooling

**Speed:** Redis-only caching, 2-layer deduplication, HTTP compression

**Reliability:** DLQ logging, retries with backoff, graceful shutdown

## 🧪 Load Testing

```bash
cd backend
npm run load-test:quick   # 100 requests
npm run load-test         # ~5000 requests
npm run load-test:stress  # 5000 in 10 seconds
```

## 🐛 Troubleshooting

```bash
# Check logs
docker-compose logs -f backend

# Check queue
curl -u admin:admin123 http://localhost:3001/api/scrape/queue/stats

# Check memory
curl http://localhost:3001/health/detailed

# View failed jobs
docker-compose logs backend | grep "\[DLQ\]"
```

## 🛠️ Tech Stack

**Backend:** Express, TypeScript, Prisma, PostgreSQL, Bull/Redis, Cheerio, Puppeteer, Zod

**Frontend:** React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, Axios

## 📄 License

MIT
