# 🔧 Cloudflare Worker + Supabase Proxy Setup Guide for rjexa.com

## Problem Summary
Your build is failing with Cloudflare challenge blocking Supabase API:
```
Error: <!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title>...
Cloudflare Challenge blocking: https://api.rjexa.com/rest/v1/posts
```

This happens because DNS isn't properly configured or the Cloudflare Worker isn't set up correctly.

---

## ✅ Step 1: Verify DNS Configuration

### Check Your Current DNS Setup
1. Go to: **Cloudflare Dashboard → rjexa.com → DNS Records**
2. Look for these records:

| Type | Name | Content | TTL | Status |
|------|------|---------|-----|--------|
| CNAME | api.rjexa.com | workers.dev (or your-worker.workers.dev) | Auto | ✅ Active |
| NS | - | amy.ns.cloudflare.com, bob.ns.cloudflare.com, ... | - | ✅ |

### If NS records show OLD Spaceship nameservers:
```bash
# Check with DNS checker tool
# Old NS records =  DNS not fully migrated
# You must update domain registrar to point to Cloudflare nameservers
```

### Update Registrar (Domain Registrar Portal):
1. Go to: **Namecheap / GoDaddy / other registrar**
2. Find: **Nameservers** or **Custom Nameservers**
3. Replace with Cloudflare nameservers:
   - `amy.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`
   - `rex.ns.cloudflare.com`
   - `violet.ns.cloudflare.com`
4. Save & wait 24-48 hours for propagation

---

## ✅ Step 2: Set Up Cloudflare Worker

### Create Supabase Proxy Worker

1. **Cloudflare Dashboard → Workers → Create Service**
   - Name: `supabase-proxy`
   - Create

2. **Add Worker Code:**
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Proxy api.rjexa.com to your-project.supabase.co
    if (url.hostname === 'api.rjexa.com') {
      // Replace with your actual Supabase URL
      const supabaseUrl = 'https://your-project.supabase.co';
      const newUrl = supabaseUrl + url.pathname + url.search;
      
      const newRequest = new Request(newUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      return fetch(newRequest);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
```

3. **Deploy Worker**
   - Save & Deploy
   - Note the worker domain: `supabase-proxy.YOUR-ACCOUNT.workers.dev`

---

## ✅ Step 3: Create CNAME Record in Cloudflare DNS

1. **Cloudflare Dashboard → DNS Records → Add Record**

```
Type:   CNAME
Name:   api
Content: supabase-proxy.YOUR-ACCOUNT.workers.dev
TTL:    Auto
Proxy:  ☑️ Proxied (Orange Cloud) ✅ IMPORTANT!
```

2. **Add another CNAME for Worker Wildcard (if needed):**
```
Type:   CNAME
Name:   api.rjexa.com
Content: supabase-proxy.YOUR-ACCOUNT.workers.dev
TTL:    Auto
Proxy:  ☑️ Proxied
```

---

## ✅ Step 4: Update .env.local in Your Next.js App

```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://api.rjexa.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-key
```

❌ **DON'T USE:** `https://your-project.supabase.co` (this will trigger Cloudflare challenge)  
✅ **USE:** `https://api.rjexa.com` (proxied through Cloudflare Worker)

---

## ✅ Step 5: Test the Setup

### Test 1: Verify DNS Resolution
```bash
# From Windows PowerShell
nslookup api.rjexa.com
# Should show Cloudflare IP addresses (1.2.3.4 range)

# Check CNAME resolution
nslookup -type=CNAME api.rjexa.com
# Should show: api.rjexa.com canonical name = supabase-proxy.xxx.workers.dev
```

### Test 2: Verify Worker Routing
```bash
# Test if Worker receives requests
curl -v https://api.rjexa.com/rest/v1/posts
# Should see response headers from Supabase (not Cloudflare challenge)
```

### Test 3: Build Test
```bash
cd frontend
npm run build
# Should NOT see Cloudflare challenge HTML in error
# Should succeed or show missing Supabase credential error (that's OK)
```

---

## 🔍 Troubleshooting Cloudflare Challenge Error

### If you still see Cloudflare Challenge:

**Problem 1: DNS not propagated**
```bash
# Check DNS globally
# Use: https://dnschecker.org
# Search: api.rjexa.com
# If some regions show old IP = needs more time (up to 48hrs)
# If all show Cloudflare IPs = DNS is good, move to Problem 2
```

**Problem 2: Worker not routing correctly**
- ✅ Verify CNAME proxy status is "Proxied" (orange cloud, not gray)
- ✅ Check Worker code has no typos in supabase URL
- ✅ Verify Worker is deployed (Status: Active)

**Problem 3: Cloudflare Bot Fight Mode**
- Go to: **Cloudflare Dashboard → Security → Bot Management**
- Check if "Super Bot Fight Mode" is enabled
- If YES, whitelist Vercel IPs:
  ```
  Security → Bot Management → Bot Rules
  Allow IPs: 76.*.*.* (Vercel range)
  ```

**Problem 4: Firewall Rules Blocking**
- Go to: **Cloudflare Dashboard → Security → WAF**
- Check if any rules are blocking Supabase requests
- Look for rules mentioning "POST", "REST", "API"
- Disable or modify if blocking Supabase

---

## 🚀 Final Verification Checklist

- [ ] Nameservers at registrar point to Cloudflare
- [ ] DNS check shows Cloudflare IPs globally
- [ ] CNAME api.rjexa.com → workers.dev (Proxied)
- [ ] Cloudflare Worker code deployed
- [ ] .env.local updated to use api.rjexa.com
- [ ] No Cloudflare challenge in curl/browser test
- [ ] npm run build succeeds without Cloudflare HTML error

---

## 📝 Next.js Build Command
```bash
cd frontend
npm run build
# If you still get Cloudflare challenge, check:
# 1. DNS propagation (use DNS checker)
# 2. Worker deployment status
# 3. CNAME proxy setting (must be orange, not gray)
# 4. Firewall/Bot rules not blocking requests
```

---

## ✅ After Setup Complete

Update **Vercel Environment Variables**:

```bash
# In Vercel Dashboard → Settings → Environment Variables

NEXT_PUBLIC_SUPABASE_URL=https://api.rjexa.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
NEXT_PUBLIC_SITE_NAME=rjexa - DevSecOps & Cloud Engineering
NEXT_PUBLIC_SITE_DESCRIPTION=DevSecOps insights, cloud architecture, security practices...
NEXT_PUBLIC_AUTHOR=Raju SRK @ rjexa inc
NEXT_PUBLIC_SITE_URL=https://rjexa.com
NEXT_PUBLIC_COMPANY_NAME=rjexa inc
NEXT_PUBLIC_COMPANY_DOMAIN=rjexa.com
```

Then: **Redeploy on Vercel** (or trigger new deployment via git push)

---

## 📞 Quick Reference

| Component | Value |
|-----------|-------|
| **Domain** | rjexa.com |
| **API Proxy Domain** | api.rjexa.com |
| **Worker Service** | supabase-proxy |
| **Target Supabase** | your-project.supabase.co |
| **Frontend App URL** | https://rjexa.com (on Vercel) |

