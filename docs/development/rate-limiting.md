# API Rate Limiting

This document explains the rate limiting implementation in the agency platform.

## Overview

The agency platform implements comprehensive API rate limiting to protect against abuse and ensure fair resource usage. The implementation uses:

- **Sliding window algorithm** for accurate rate limiting without boundary bursts
- **Redis-based storage** for production scalability
- **Multi-tenant isolation** for fair resource distribution
- **Tiered rate limits** based on authentication status

## Rate Limit Tiers

### General API (100 requests/hour)
- Unauthenticated users
- General browsing and public endpoints
- Key: `rate-limit:api-general`

### Authenticated API (1000 requests/hour)
- Authenticated users
- Protected routes and dashboard access
- Key: `rate-limit:api-auth`

### Strict API (10 requests/minute)
- Sensitive endpoints (authentication, forms)
- High-value operations
- Key: `rate-limit:api-strict`

## Multi-Tenant Isolation

Rate limits are isolated per tenant to ensure fair resource distribution:

```
rate-limit:{prefix}:tenant:{tenant-id}:ip:{ip-address}:{auth|anon}
```

This prevents:
- One tenant from consuming all rate limit quotas
- Cross-tenant rate limit interference
- IP-based attacks affecting other tenants

## Implementation

### Middleware Integration

Rate limiting is automatically applied in all application middleware:

```typescript
// apps/agency-admin/src/middleware.ts
import { applyRateLimit, RateLimitPresets, getClientIP } from '@agency/database'

// Apply rate limiting
const clientIP = getClientIP(request)
const isAPIRoute = request.nextUrl.pathname.startsWith('/api/')
const rateLimitContext = {
  tenantId,
  ip: clientIP,
  authenticated: !!user,
  isService: false,
}

const limiter = user 
  ? RateLimitPresets.authenticated 
  : isAPIRoute 
    ? RateLimitPresets.strict 
    : RateLimitPresets.general

const { allowed, result } = await applyRateLimit(request, rateLimitContext, limiter)
```

### Response Headers

Rate limiting adds standard headers to responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### Error Responses

When rate limits are exceeded, returns HTTP 429 with problem+json:

```json
{
  "type": "https://agency.dev/problems/rate-limit-exceeded",
  "title": "Rate limit exceeded",
  "status": 429,
  "detail": "Too many requests. Please try again later.",
  "instance": "/api/endpoint",
  "code": "RATE_LIMIT_EXCEEDED",
  "correlationId": "req-123",
  "retryAfter": 60
}
```

## Configuration

### Environment Variables

```bash
# Redis connection for rate limiting (optional)
REDIS_URL=redis://localhost:6379

# Falls back to in-memory storage if not configured
```

### Custom Rate Limiters

Create custom rate limiters for specific use cases:

```typescript
import { RateLimiter } from '@agency/database'

const customLimiter = new RateLimiter({
  limit: 50,
  window: 300, // 5 minutes
  keyPrefix: 'custom-endpoint',
}, process.env.REDIS_URL || 'memory')
```

## Testing

Rate limiting includes comprehensive test coverage:

```bash
# Run rate limiting tests
pnpm --filter @agency/database test src/rate-limiter.test.ts
```

### Test Coverage

- ✅ Request limits enforcement
- ✅ Multi-tenant isolation
- ✅ IP-based isolation  
- ✅ Authentication tiering
- ✅ Service operation bypass
- ✅ Header generation
- ✅ IP extraction from various headers

## Security Considerations

### Service Operations

Service operations can bypass rate limits by setting `isService: true`:

```typescript
const context = {
  tenantId,
  ip: clientIP,
  authenticated: !!user,
  isService: true, // Bypasses rate limits
}
```

### Fail-Open Strategy

If Redis is unavailable, the system fails open (allows requests) to maintain availability:

```typescript
// Redis failure handling
try {
  const result = await redis.eval(luaScript, ...)
  return result
} catch (error) {
  console.error('Rate limiter Redis error:', error)
  // Fail open - allow request
  return { success: true, limit: this.config.limit }
}
```

## Monitoring

Rate limit violations are logged with structured data:

```typescript
console.warn(
  JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: 'Rate limit exceeded',
    service: 'agency-admin',
    requestId,
    pathname: request.nextUrl.pathname,
    tenantId,
    ip: clientIP,
    limit: result.limit,
    remaining: result.remaining,
  })
)
```

## Best Practices

### 1. Choose Appropriate Limits

- **Public APIs**: Lower limits (100/hour)
- **Authenticated APIs**: Higher limits (1000/hour)
- **Sensitive Operations**: Strict limits (10/minute)

### 2. Monitor Usage

Track rate limit violations to identify:
- Abusive clients
- API usage patterns
- Need for limit adjustments

### 3. Test Thoroughly

- Test rate limit enforcement
- Verify multi-tenant isolation
- Test Redis failure scenarios
- Validate header responses

### 4. Consider Edge Cases

- Cloudflare IP headers
- Load balancer forwarding
- IPv6 addresses
- Shared network environments

## Performance Impact

### Redis Operations

- Single Redis round trip per request
- Atomic Lua script execution
- Automatic key expiration
- Minimal memory footprint

### In-Memory Fallback

- Used when Redis unavailable
- Per-process storage only
- Automatic cleanup on restart
- Suitable for development/testing

## Troubleshooting

### Common Issues

1. **Rate limits not working**: Check Redis connection
2. **All requests blocked**: Verify tenant resolution
3. **Headers missing**: Ensure middleware execution order
4. **Test failures**: Check ioredis installation

### Debug Mode

Enable debug logging to trace rate limiting:

```bash
DEBUG=rate-limit:* pnpm dev
```

## Future Enhancements

- **Distributed rate limiting** for multi-instance deployments
- **Adaptive rate limits** based on system load
- **User-specific rate limits** for premium tiers
- **Rate limit analytics** and dashboard integration
