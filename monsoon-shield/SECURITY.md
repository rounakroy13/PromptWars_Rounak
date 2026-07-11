# Security Policy - MonsoonShield AI

## 🔐 Security Features Implemented

### 1. API Security

#### Rate Limiting
- **General API**: 30 requests per minute per IP
- **AI Endpoints**: 10 requests per minute per IP (more expensive operations)
- **Emergency SOS**: 20 requests per minute (more lenient for emergencies)

#### Input Validation & Sanitization
- All user inputs are sanitized using the `xss` library
- Input length limits: 2,000 characters maximum
- Request body size limit: 10KB
- Mode and language parameters validated against whitelists

#### CORS Configuration
- Whitelist-based origin validation
- Only allows `GET` and `POST` methods
- Restricted headers: `Content-Type`, `Authorization`

### 2. HTTP Security Headers (via Helmet)

- **Content-Security-Policy**: Restricts resource loading
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Legacy XSS filter
- **Strict-Transport-Security**: Enforces HTTPS
- **Referrer-Policy**: Controls referrer information

### 3. Environment Security

#### Required Environment Variables
```
GROQ_API_KEY=your_groq_api_key_here (required)
PORT=3000 (optional, defaults to 3000)
NODE_ENV=development|production (optional)
CORS_ORIGIN=http://localhost:3000 (optional)
RATE_LIMIT_WINDOW_MS=60000 (optional)
RATE_LIMIT_MAX_REQUESTS=30 (optional)
```

#### API Key Validation
- Server validates GROQ_API_KEY presence on startup
- Format validation (should start with `gsk_`)
- Server will not start without required keys

### 4. Error Handling

- Global error handler catches all unhandled errors
- Stack traces hidden in production
- Async error wrapper for all route handlers
- 404 handler for unknown routes

### 5. Logging & Monitoring

- Winston logger with structured JSON output
- Request logging: method, URL, status, duration, IP
- Security event logging (rate limit violations, CORS blocks)
- Different log levels for development vs production

## 🚨 Reporting Security Vulnerabilities

If you discover a security vulnerability, please:

1. **DO NOT** create a public GitHub issue
2. Email the maintainer directly with details
3. Include steps to reproduce the vulnerability
4. Allow reasonable time for a fix before disclosure

## ⚠️ Security Best Practices for Deployment

### Environment Variables
```bash
# NEVER commit .env files
# Use environment variable management in production:
# - Railway: Settings > Variables
# - Heroku: Config Vars
# - AWS: Parameter Store or Secrets Manager
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only
- [ ] Set proper CORS_ORIGIN for your domain
- [ ] Rotate API keys regularly
- [ ] Enable logging to external service
- [ ] Set up monitoring and alerting
- [ ] Regular security audits with `npm audit`

### Key Rotation
Rotate your API keys immediately if:
- You suspect they've been compromised
- A team member with access leaves
- You've accidentally committed them
- It's been more than 90 days

## 📋 Security Audit Commands

```bash
# Check for known vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Run security-focused audit
npm run security-check
```

## 🔒 Data Privacy

MonsoonShield AI:
- Does NOT store user conversations permanently
- Uses caching (5 minutes TTL) for efficiency only
- Does NOT track users across sessions
- Does NOT share data with third parties
- Processes data through Groq's API (see their privacy policy)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-11-07 | Added comprehensive security features |
| 1.0.0 | 2026-11-06 | Initial release |