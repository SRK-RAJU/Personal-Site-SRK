# 🧹 WORKSPACE CLEANUP - Remove Old Files

This guide will help you clean up your workspace to prepare for the **100% FREE Supabase architecture**.

## ❌ FILES TO DELETE

### 1. Delete WordPress Admin Files (500+ files)
```powershell
# PowerShell - Run this command
Remove-Item -Path "c:\Users\Raju\local-vs-code-files\Personal-Site-SRK\wp-admin" -Recurse -Force
```

Or **manually**:
1. Open File Explorer
2. Navigate to `Personal-Site-SRK`
3. Right-click `wp-admin` folder → Delete
4. Right-click `diag` folder (if empty) → Delete

### 2. Delete Backend Folder (Not needed with Supabase)
```powershell
Remove-Item -Path "c:\Users\Raju\local-vs-code-files\Personal-Site-SRK\modern-blog-app\backend" -Recurse -Force
```

Or **manually**:
1. Open `modern-blog-app` folder
2. Right-click `backend` folder → Delete

### 3. Verify Cleanup
```powershell
# Check what's left
Get-ChildItem -Path "c:\Users\Raju\local-vs-code-files\Personal-Site-SRK" -Force
```

You should see:
```
.git/
modern-blog-app/
README.md
.gitignore
```

---

## ✅ WHAT TO KEEP

- ✅ `.git/` - GitHub tracking
- ✅ `modern-blog-app/frontend` - Your website
- ✅ `modern-blog-app/docs/` - Documentation
- ✅ `modern-blog-app/` - Everything inside here

---

## 📊 BEFORE & AFTER

### **Before Cleanup**
```
Personal-Site-SRK/
├── wp-admin/        ❌ DELETE (500+ files, 10MB+)
├── diag/            ❌ DELETE
├── modern-blog-app/
│   ├── backend/     ❌ DELETE (Not needed)
│   ├── frontend/    ✅ KEEP
│   └── docs/
├── .git/
└── README.md
```

### **After Cleanup**
```
Personal-Site-SRK/
├── modern-blog-app/
│   ├── frontend/    ✅ Your Next.js app
│   ├── docs/        ✅ Guides & docs
│   ├── SETUP.md
│   ├── QUICK_START.md
│   └── package.json
├── .git/            ✅ Git tracking
└── README.md        ✅ Updated
```

**Space saved**: ~50-100MB (all WordPress files gone)

---

## 🚀 NEXT STEPS

After cleanup, follow:
1. **NEW SUPABASE_SETUP.md** - Setup free Supabase
2. **VERCEL_DEPLOY.md** - Deploy to Vercel
3. **SUPABASE_GUIDE.md** - Connect frontend to Supabase

---

## ⚠️ IMPORTANT

- **Make sure you're not in any of these folders** when deleting
- **Close VS Code** before deleting (so it doesn't lock files)
- **Git will still track** - You can revert if needed

Once deleted, you'll have a **clean, lean, fast** project ready for FREE Supabase architecture! ✨
