# HR Automation - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Firebase project setup

---

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it (e.g., "hr-automation")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firebase Services

**Enable Authentication:**
1. Go to "Authentication" in sidebar
2. Click "Get started"
3. Enable "Email/Password" provider
4. Enable "Google" provider (optional)

**Enable Firestore Database:**
1. Go to "Firestore Database" in sidebar
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location (closest to your users)
5. Click "Enable"

**Enable Storage:**
1. Go to "Storage" in sidebar
2. Click "Get started"
3. Use default security rules for now
4. Click "Done"

### 1.3 Get Firebase Configuration
1. Click the gear icon → "Project settings"
2. Scroll to "Your apps"
3. Click the web icon (`</>`)
4. Register your app (name: "HR Automation Web")
5. Copy the config object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 2: Update Firestore Security Rules

Go to Firestore Database → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Resumes collection
    match /resumes/{resumeId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId;
    }
    
    // Notes collection
    match /notes/{noteId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click "Publish"

---

## Step 3: Update Firebase Storage Rules

Go to Storage → Rules and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click "Publish"

---

## Step 4: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with Firebase integration"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/hr-automation.git

# Push to GitHub
git push -u origin main
```

---

## Step 5: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables (click "Environment Variables"):

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

6. Click "Deploy"
7. Wait for deployment to complete (1-2 minutes)
8. Visit your live URL! 🎉

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: hr-automation
# - Directory: ./
# - Override settings? No

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID

# Deploy to production
vercel --prod
```

---

## Step 6: Configure Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Add your Vercel domain (e.g., `hr-automation.vercel.app`)
4. Save

---

## Step 7: Test Your Deployment

1. Visit your Vercel URL
2. Click "Get Started" or "Sign Up"
3. Create an account with email/password
4. Login
5. Test all features:
   - ✅ Profile page (edit and save)
   - ✅ Billing page (change plans)
   - ✅ Upload resume
   - ✅ View dashboard stats
   - ✅ Logout and login again

---

## 🔧 Troubleshooting

### Build Fails with TypeScript Errors
**Solution**: Already fixed! `tsconfig.json` excludes old Next.js files.

### Firebase "Missing or insufficient permissions"
**Solution**: Check Firestore security rules. Make sure user is authenticated.

### Firebase "Storage unauthorized"
**Solution**: Check Storage security rules. Verify user is logged in.

### Environment Variables Not Working
**Solution**: 
1. Make sure variables start with `VITE_`
2. Redeploy after adding variables
3. Check Vercel dashboard → Settings → Environment Variables

### "Firebase app not initialized"
**Solution**: Check that all environment variables are set correctly in Vercel.

---

## 📊 Post-Deployment Checklist

- [ ] Firebase Authentication working
- [ ] Can create new account
- [ ] Can login/logout
- [ ] Profile page loads and saves
- [ ] Can change subscription plan
- [ ] Can upload resumes
- [ ] Dashboard shows real stats
- [ ] Files upload to Firebase Storage
- [ ] Data persists in Firestore
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Custom domain configured (optional)

---

## 🎨 Optional: Custom Domain

### On Vercel:
1. Go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Update Firebase:
1. Go to Firebase Console → Authentication → Settings
2. Add custom domain to "Authorized domains"

---

## 🔒 Security Best Practices

### 1. Enable App Check (Recommended)
```bash
# In Firebase Console
1. Go to App Check
2. Register your web app
3. Use reCAPTCHA v3
4. Enable enforcement for Firestore and Storage
```

### 2. Set up Budget Alerts
```bash
# In Firebase Console
1. Go to Usage and billing
2. Set budget alerts
3. Recommended: $10/month for free tier
```

### 3. Enable Firestore Backups
```bash
# In Firebase Console
1. Go to Firestore Database → Backups
2. Set up automated daily backups
```

---

## 📈 Monitoring

### Vercel Analytics
1. Go to your project → Analytics
2. Enable Web Analytics (free)
3. Monitor performance and traffic

### Firebase Console
1. Authentication → Users (monitor signups)
2. Firestore → Usage (check read/write counts)
3. Storage → Usage (monitor file uploads)

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel automatically builds and deploys!
```

---

## 💰 Cost Estimation

### Firebase Free Tier (Spark Plan)
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1 GB storage
- ✅ 10 GB bandwidth/month
- ✅ Perfect for development and small apps

### Vercel Free Tier
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Perfect for personal projects

**Expected Cost for Small Team (< 50 users)**: $0/month 🎉

---

## 🆘 Support

### Issues?
1. Check [CONVERSION_NOTES.md](./CONVERSION_NOTES.md) for technical details
2. Review Firebase Console → Usage for quota issues
3. Check Vercel deployment logs
4. Verify environment variables are set

### Common URLs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com/
- **GitHub Repo**: https://github.com/YOUR_USERNAME/hr-automation

---

## 🎉 Success!

Your HR Automation app is now live with:
- ✅ Real-time Firebase database
- ✅ Secure file storage
- ✅ User authentication
- ✅ Automatic deployments
- ✅ Production-ready infrastructure

**Next Steps**:
1. Share your app URL with team
2. Start uploading resumes
3. Monitor usage in Firebase Console
4. Plan future enhancements (Stripe, AI, n8n)

---

**Deployed By**: [Your Name]  
**Deployment Date**: [Today's Date]  
**App URL**: https://your-app.vercel.app  
**Status**: 🟢 Live & Running