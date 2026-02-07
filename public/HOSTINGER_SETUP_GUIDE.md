# TargetFlow Pro - Complete Deployment Guide

## 📁 Exported Files

### Database
- `complete-supabase-setup.sql` - Complete database schema with all tables, functions, triggers, and RLS policies

### Edge Functions (in `edge-functions/` folder)
- `delete-user.ts` - Admin user deletion
- `send-invoice-email.ts` - Email sending via Resend
- `scheduled-backup.ts` - Automated backup cron job
- `shorten-url.ts` - URL shortener for WhatsApp sharing
- `redirect.ts` - Short URL redirect handler

---

## 🔧 Setup Steps

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save your:
   - Project URL (e.g., `https://xxxx.supabase.co`)
   - Anon Key (public)
   - Service Role Key (private - for edge functions)

### Step 2: Run Database Setup
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy entire content of `complete-supabase-setup.sql`
3. Paste and click **Run**
4. Wait for all statements to complete

### Step 3: Create First Admin User
1. Sign up in your app
2. Go to Supabase → **Authentication** → **Users**
3. Copy your user ID
4. Run this SQL in SQL Editor:
```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'YOUR-USER-ID-HERE';
```

### Step 4: Deploy Edge Functions
Using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy each function
supabase functions deploy delete-user
supabase functions deploy send-invoice-email
supabase functions deploy scheduled-backup
supabase functions deploy shorten-url
supabase functions deploy redirect
```

Or manually in Supabase Dashboard → **Edge Functions** → **New Function**

### Step 5: Set Edge Function Secrets
In Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**:

```
RESEND_API_KEY=your_resend_api_key
```

(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected)

### Step 6: Update App Configuration
Create `.env` file in your project root:

```env
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

### Step 7: Build for Production
```bash
npm install
npm run build
```

### Step 8: Deploy to Hostinger
1. Login to Hostinger → **File Manager**
2. Navigate to `public_html`
3. Upload all contents of `dist/` folder
4. Create `.htaccess` file:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## ⚠️ Important Notes

### About Short URLs (WhatsApp Sharing)
The short URL redirect requires edge function URL configuration. Update your app to use:
```
https://YOUR-PROJECT.supabase.co/functions/v1/redirect/SHORT_CODE
```

### Scheduled Backups
Set up a cron job to call the scheduled-backup function:
- Supabase Dashboard → **Database** → **Extensions** → Enable `pg_cron`
- Or use external cron service to call the function URL hourly

### Storage Bucket
The `document-pdfs` bucket is created automatically. Ensure storage policies are applied.

---

## 🔐 Admin Capabilities

With admin role, you can:
- ✅ View all users
- ✅ Change user roles
- ✅ Delete users
- ✅ Access all projects (cross-user visibility)
- ✅ Full CRUD on all data
- ✅ Backup/restore functionality
- ✅ System settings

---

## 📞 Support

If you face any issues:
1. Check Supabase logs: Dashboard → **Logs**
2. Check edge function logs: Dashboard → **Edge Functions** → Select function → **Logs**
3. Verify RLS policies are correctly applied
4. Ensure all secrets are set correctly
