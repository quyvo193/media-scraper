# Load Testing with Artillery

This directory contains Artillery load test configurations to verify the system can handle **5000 concurrent scraping requests** on a server with **1 CPU and 1GB RAM**.

## Prerequisites

1. **Backend server running** on `http://localhost:3001`
2. **Redis running** (for Bull queue)
3. **PostgreSQL running** (for job storage)
4. **Admin user created** (default: admin/admin123)

## Test Configurations

### 1. Quick Test (`artillery-quick.yml`)
- **Purpose**: Smoke test for development
- **Load**: 100 requests over 10 seconds
- **Use case**: Verify the system works before running full load test

```bash
npm run load-test:quick
```

### 2. Standard Load Test (`artillery.yml`)
- **Purpose**: Validate 5000 concurrent request requirement
- **Load**: ~5000 requests over 73 seconds
  - Warm-up: 10 req/sec for 10s (100 requests)
  - Ramp-up: 10→100 req/sec over 30s (~1650 requests)
  - Sustained: 100 req/sec for 33s (~3300 requests)
- **Thresholds**:
  - p95 response time < 1 second
  - Error rate < 5%

```bash
npm run load-test
```

### 3. Stress Test (`artillery-stress.yml`)
- **Purpose**: Find the system's breaking point
- **Load**: 5000 requests in 10 seconds (500 req/sec)
- **Thresholds**:
  - p99 response time < 5 seconds
  - Error rate < 10%

```bash
npm run load-test:stress
```

### 4. Generate HTML Report

```bash
npm run load-test:report
```

This generates `load-test/report.html` with detailed metrics.

## Expected Results

On a **1 CPU / 1GB RAM** server:

| Metric | Target | Explanation |
|--------|--------|-------------|
| Response Time (p95) | < 1 second | Jobs should queue quickly |
| Response Time (p50) | < 200ms | Median response time |
| Error Rate | < 5% | Most requests should succeed |
| Throughput | ~100 req/sec | Sustained rate for queuing |

## Key Metrics to Monitor

### During the Test

```bash
# In another terminal, watch queue stats
curl -u admin:admin123 http://localhost:3001/api/scrape/queue/stats

# Watch memory usage
curl http://localhost:3001/health/detailed
```

### What "Success" Looks Like

1. ✅ All 5000 requests get HTTP 201 (job created)
2. ✅ Response times stay under 1 second
3. ✅ Memory stays under 1GB
4. ✅ No server crashes or OOM errors
5. ✅ Jobs queue successfully (even if processing takes time)

### Understanding the Results

The key insight is: **accepting requests ≠ processing them immediately**

- The load test measures how fast the system can **accept and queue** jobs
- Actual scraping happens in the background via Bull queue
- With 1 CPU, processing all 5000 URLs will take hours, but that's expected

## Troubleshooting

### High Error Rate

1. **Check Redis connection**: Queue might be down
2. **Check database**: PostgreSQL might be slow
3. **Memory pressure**: Server might be swapping

### Slow Response Times

1. **Database queries**: Add indexes
2. **Queue saturation**: Jobs piling up
3. **GC pauses**: Memory optimization needed

### Running on Docker

If testing against Docker containers:

```bash
# Start the stack
docker-compose up -d

# Run load test (containers must be healthy)
npm run load-test
```

## Customizing Tests

### Change Target URL

Edit the `target` in any YAML file:

```yaml
config:
  target: "http://your-server:3001"
```

### Change Auth Credentials

Generate new base64 credentials:

```bash
echo -n "username:password" | base64
```

Update the `Authorization` header in YAML files.

### Change Load Profile

Modify the `phases` section:

```yaml
phases:
  - duration: 60      # Duration in seconds
    arrivalRate: 50   # Requests per second
    name: "Custom Load"
```

## Files

| File | Description |
|------|-------------|
| `artillery.yml` | Main load test (5000 requests) |
| `artillery-quick.yml` | Quick smoke test (100 requests) |
| `artillery-stress.yml` | Stress test (5000 in 10 seconds) |
| `helpers.js` | URL generator and helper functions |
| `results.json` | Raw test results (generated) |
| `report.html` | HTML report (generated) |

