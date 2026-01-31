# Supabase Setup Guide for Clock It

## ✅ Your Supabase Project is Ready!

**Your Supabase URL:** `https://odeywendatejizdiwvut.supabase.co`

Now you just need to get your **API key** and set up the database.

---

## Step 1: Get Your Supabase Anon Key (2 minutes)

1. **Go to your Supabase dashboard:**
   - https://supabase.com/dashboard

2. **Select your Clock It project** (the one with URL: odeywendatejizdiwvut.supabase.co)

3. **Click the Settings icon** (⚙️) in the left sidebar

4. **Click "API"** under Project Settings

5. **Find "Project API keys" section**

6. **Copy the `anon` `public` key**
   - It's a long string starting with `eyJ...`
   - This is your **SUPABASE_ANON_KEY**

7. **In your `supabase-config.js`, replace:**
   ```javascript
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   
   **With:**
   ```javascript
   const SUPABASE_ANON_KEY = 'eyJhbGc...your-actual-key...';
   ```

---

## Step 2: Set Up Database Tables (3 minutes)

### Create Photos Table

1. **In Supabase dashboard**, click **"SQL Editor"** (left sidebar)

2. **Click "New query"**

3. **Paste this SQL:**

```sql
-- Create photos table
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  photo_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  timestamp BIGINT NOT NULL,
  favorite BOOLEAN DEFAULT FALSE,
  uploaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX photos_user_id_idx ON photos(user_id);
CREATE INDEX photos_timestamp_idx ON photos(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their own photos)
CREATE POLICY "Users can view own photos" 
  ON photos FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" 
  ON photos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" 
  ON photos FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" 
  ON photos FOR DELETE 
  USING (auth.uid() = user_id);
```

4. **Click "Run"** (or press Ctrl+Enter)

5. **You should see:** "Success. No rows returned"

✅ **Table created!**

---

## Step 3: Set Up Storage Bucket (2 minutes)

### Create Photos Bucket

1. **In Supabase dashboard**, click **"Storage"** (left sidebar)

2. **Click "New bucket"**

3. **Fill in:**
   - **Name:** `clockit-photos`
   - **Public bucket:** ✅ Check this
   - **File size limit:** Leave default (50MB is fine)

4. **Click "Create bucket"**

### Set Storage Policies

1. **Click on your `clockit-photos` bucket**

2. **Click "Policies"** tab

3. **Click "New policy"**

4. **For INSERT (upload):**
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload own photos"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'clockit-photos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

5. **For SELECT (download):**
   ```sql
   -- Allow authenticated users to view own photos
   CREATE POLICY "Users can view own photos"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'clockit-photos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

6. **For DELETE:**
   ```sql
   -- Allow authenticated users to delete own photos
   CREATE POLICY "Users can delete own photos"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'clockit-photos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

---

## Step 4: Configure Google OAuth (5 minutes)

This connects your Google OAuth to Supabase.

### In Supabase:

1. **Go to Authentication** → **Providers** (left sidebar)

2. **Find "Google"** and toggle it **ON**

3. **You'll need to add:**
   - **Client ID:** `266277627226-c6991ph055g8aphgqt3fdknkbqf0re22.apps.googleusercontent.com`
   - **Client Secret:** (You need to get this from Google Cloud Console)

### Get Client Secret from Google:

1. **Go to:** https://console.cloud.google.com/apis/credentials

2. **Select your project** (Clock It)

3. **Find your OAuth 2.0 Client ID** (the one ending in ...c6991ph055g8aphgqt3fdknkbqf0re22)

4. **Click on it**

5. **Copy the "Client secret"** (looks like: GOCSPX-xxxxxx...)

6. **Go back to Supabase** and paste it in the Client Secret field

7. **Click "Save"**

### Add Redirect URL to Google:

1. **Still in Google Cloud Console** → Your OAuth Client

2. **Under "Authorized redirect URIs"**, add:
   ```
   https://odeywendatejizdiwvut.supabase.co/auth/v1/callback
   ```

3. **Click "Save"**

---

## Step 5: Test Everything (2 minutes)

1. **Upload your updated files** to GitHub:
   - supabase-config.js (with your anon key)
   - app.js (already has your Google client ID)

2. **Open your app**

3. **Click "Sign in with Google"**

4. **You should:**
   - Be redirected to Google login
   - After login, return to app
   - See your profile picture
   - Be able to take/upload photos

5. **Take a test photo**

6. **Check Supabase:**
   - Go to Storage → clockit-photos
   - You should see a folder with your user ID
   - Inside: your photo!
   - Go to Table Editor → photos
   - You should see a row with your photo data

✅ **Everything working!**

---

## What You Have Now

### ✅ Google Sign-In
- Users log in with Google
- Secure OAuth flow
- Your Client ID: `266277627226-c6991ph055g8aphgqt3fdknkbqf0re22...`

### ✅ Supabase Cloud Storage
- Photos stored in cloud
- Each user has their own folder
- Public URLs for easy access
- Your URL: `https://odeywendatejizdiwvut.supabase.co`

### ✅ Cross-Device Sync
- Login on any device
- See all your photos
- Automatic sync

### ✅ Secure
- Row Level Security (RLS)
- Users only see their own data
- Authenticated access only

---

## Free Tier Limits

**Supabase Free Plan:**
- 📦 500 MB database storage
- 📥 1 GB file storage
- 📡 2 GB bandwidth/month
- 👥 50,000 monthly active users

**For Clock It:**
- ~2,000 photos (assuming 500KB each)
- ~200-500 active users
- Plenty for starting out!

---

## Troubleshooting

### "Invalid API key"
→ Check you copied the `anon` `public` key (not service_role)
→ Make sure no extra spaces in the key

### "403 Forbidden" when uploading
→ Check storage policies are set up
→ Verify bucket is named exactly `clockit-photos`

### Google sign-in doesn't work
→ Check redirect URI in both Google Console and Supabase
→ Make sure Client Secret is correct
→ Verify Google provider is enabled in Supabase

### Photos don't appear after upload
→ Check Table Editor → photos table
→ Check Storage → clockit-photos bucket
→ Look at browser console for errors

---

## Summary Checklist

Before going live, verify:

- [ ] Copied Supabase anon key to `supabase-config.js`
- [ ] Created `photos` table in database
- [ ] Created `clockit-photos` storage bucket
- [ ] Set up storage policies
- [ ] Configured Google OAuth in Supabase
- [ ] Added Supabase redirect URI to Google Console
- [ ] Tested sign-in works
- [ ] Tested photo upload works
- [ ] Tested photos appear in Supabase

---

## Your Configuration Summary

**Google OAuth Client ID:**
```
266277627226-c6991ph055g8aphgqt3fdknkbqf0re22.apps.googleusercontent.com
```

**Supabase URL:**
```
https://odeywendatejizdiwvut.supabase.co
```

**Supabase Callback URL:**
```
https://odeywendatejizdiwvut.supabase.co/auth/v1/callback
```

**Your GitHub Pages URL:** (add your redirect)
```
https://emmyware.github.io/Clockit-app/
```

---

## Need Help?

If you get stuck on any step:
1. Check the error message in browser console (F12)
2. Check Supabase logs (Dashboard → Logs)
3. Let me know which step and what error!

**You're almost there!** Just need to:
1. Get your Supabase anon key
2. Run the SQL to create the table
3. Create the storage bucket
4. Test it works!

Let me know when you have your anon key and I'll help with any issues! 🚀
