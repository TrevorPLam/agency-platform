# Troubleshooting Guide

This guide covers common issues and their solutions for the agency platform.

---

## Development Issues

### Build Failures

**Problem**: Build fails with TypeScript errors
**Solution**: 
- Ensure Node.js 22.x and pnpm 10.x are installed
- Run `pnpm db:generate-types` after schema changes
- Check for missing dependencies with `pnpm install`

**Problem**: Vite/Next.js development server won't start
**Solution**:
- Check for port conflicts: `lsof -i :3000` (macOS) or `netstat -ano | findstr :3000` (Windows)
- Kill conflicting processes
- Ensure `.env.local` is properly configured

### Database Issues

**Problem**: Supabase connection fails
**Solution**:
- Verify Docker Desktop is running
- Check Supabase URL and keys in `.env.local`
- Restart Supabase: `supabase stop && supabase start`
- Reset database: `supabase db reset`

**Problem**: Database types are out of sync
**Solution**:
- Regenerate types: `pnpm db:generate-types`
- Commit updated `packages/database/src/types.ts`
- Check CI type drift gate for specific errors

### Authentication Issues

**Problem**: Login redirects fail
**Solution**:
- Check redirect URL validation in auth actions
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Ensure CORS is configured for your domain

**Problem**: JWT token errors
**Solution**:
- Check Supabase JWT secret configuration
- Verify token expiration settings
- Ensure `app_metadata` is used instead of `user_metadata`

---

## Deployment Issues

### Vercel Deployment

**Problem**: Build fails on Vercel
**Solution**:
- Check environment variables in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify build command: `pnpm build`

**Problem**: Database connection fails in production
**Solution**:
- Update Supabase project URL and keys
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (server-side only)
- Check RLS policies are properly configured

### Performance Issues

**Problem**: Slow page loads
**Solution**:
- Check Core Web Vitals in browser dev tools
- Optimize images and assets
- Review database query performance

**Problem**: Memory leaks
**Solution**:
- Check for unclosed database connections
- Review React component cleanup
- Monitor with browser dev tools memory tab

---

## Common Error Messages

### TypeScript Errors

**`error TS2307: Cannot find module`**
- Install missing package: `pnpm add <package>`
- Check package.json for correct version
- Verify import path is correct

**`error TS2322: Type 'string' is not assignable to type`**
- Use proper TypeScript types
- Add type assertions if necessary
- Check database types are up to date

### Runtime Errors

**`TypeError: Cannot read property 'X' of undefined`**
- Add null checks before property access
- Use optional chaining: `obj?.prop`
- Initialize variables properly

**`Error: connect ECONNREFUSED`**
- Check if required service is running
- Verify port numbers and URLs
- Check firewall settings

---

## Debugging Tools

### Browser DevTools
- **Console**: Check for JavaScript errors
- **Network**: Monitor API calls and responses
- **Performance**: Analyze page load times
- **Application**: Review local storage and cookies

### Database Debugging
- **Supabase Studio**: Visual database interface
- **pgTAP tests**: Run RLS isolation tests
- **Query logs**: Check database query performance

### Build Debugging
- **Turborepo**: Check build cache and dependencies
- **Vitest**: Run unit tests for specific modules
- **ESLint**: Check for code quality issues

---

## Getting Help

### Self-Service Resources
1. **Search existing issues**: Check GitHub issues for similar problems
2. **Documentation**: Review relevant docs in `/docs`
3. **Error logs**: Check browser console and server logs

### Community Support
1. **Discord**: Join our [Discord community](https://discord.gg/agency)
2. **GitHub Discussions**: Ask questions in [discussions](https://github.com/agency/platform/discussions)
3. **Stack Overflow**: Tag questions with `agency-platform`

### Direct Support
1. **Email**: support@agency.com (response within 24h)
2. **Emergency**: For production outages, call our emergency hotline

---

## Advanced Troubleshooting

### Performance Profiling
```bash
# Profile Next.js app
NEXT_DEBUG=1 pnpm dev

# Analyze bundle size
pnpm build --analyze
```

### Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Memory Profiling
```bash
# Node.js memory profiling
node --inspect-brk node_modules/.bin/next dev

# Heap snapshot analysis
node --heap-prof next dev
```

---

## Prevention Tips

### Development Best Practices
- Run `pnpm type-check` before committing
- Test database changes locally first
- Use environment-specific configurations
- Keep dependencies updated regularly

### Monitoring Setup
- Set up error tracking (Sentry, etc.)
- Monitor Core Web Vitals
- Track database performance metrics
- Set up uptime monitoring

### Documentation Maintenance
- Update troubleshooting steps when new issues are found
- Document common solutions for team knowledge
- Keep error message documentation current
- Maintain runbooks for common scenarios

---

*Last updated: March 17, 2026*
*Contributors: Platform Team*
