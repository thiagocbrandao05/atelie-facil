# 🌐 CDN Setup Guide

This guide explains how to configure a Content Delivery Network (CDN) for AteliêFácil using the built-in configuration.

## 1. Overview

The application is configured to support CDN asset offloading via the `assetPrefix` configuration in `next.config.ts`. This allows you to serve static assets (JavaScript, CSS, Images) from a CDN like Cloudflare, Vercel Edge, or AWS CloudFront.

## 2. Configuration

To enable the CDN, simply set the `CDN_URL` environment variable in your production environment.

### Environment Variable

```bash
CDN_URL="https://cdn.your-domain.com"
```

### How it works

When `CDN_URL` is defined, Next.js will automatically prepend this URL to all static asset requests.

**Example**:

- Local: `/_next/static/chunks/main.js`
- With CDN: `https://cdn.your-domain.com/_next/static/chunks/main.js`

## 3. Provider Guides

### Vercel (Automatic)

If you deploy to Vercel, the Edge Network is automatically configured. You usually **do not** need to set `CDN_URL` manually unless you are using a separate asset domain.

### Cloudflare

1. Point your domain to Cloudflare.
2. Enable "Cache Everything" page rule for `/_next/static/*`.
3. The `CDN_URL` is technically not needed if you proxy the entire domain, but useful if you have a separate `assets.your-domain.com`.

### AWS CloudFront / S3

1. Create a CloudFront distribution pointing to your app origin.
2. Set `CDN_URL` to your CloudFront URL (e.g., `https://d12345.cloudfront.net`).
3. Ensure your build pipeline uploads `.next/static` to the S3 bucket backing the CloudFront distribution.

## 4. Verification

To verify CDN is working:

1. Build the app: `npm run build`
2. Start the app: `npm start`
3. Check the source code of any page.
4. Verify that script tags point to your `CDN_URL`.

```html
<script src="https://cdn.your-domain.com/_next/static/..." defer></script>
```
