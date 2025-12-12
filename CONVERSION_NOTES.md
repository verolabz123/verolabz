# Profile and Billing Page Conversion Notes

## Overview
Successfully converted Profile and Billing settings pages from Next.js to React.js with Firebase backend integration.

## Files Converted

### 1. ProfilePage.tsx
**Location:** `src/pages/dashboard/ProfilePage.tsx`

**Features:**
- ✅ User profile management with Firebase Firestore
- ✅ Auto-create user profile if it doesn't exist
- ✅ Real-time form state management
- ✅ Email notifications toggle
- ✅ Firebase authentication integration via AuthContext
- ✅ Loading states with spinner
- ✅ Toast notifications for success/error feedback
- ✅ Responsive layout with Tailwind CSS

**Firebase Operations:**
- `getUserById()` - Fetch user profile from Firestore
- `createUser()` - Create new user profile if missing
- `updateUser()` - Update profile fields (name, company, role, emailNotifications)

**Form Fields:**
- Full Name
- Company Name
- Role/Title
- Email Notifications (Switch)

---

### 2. BillingPage.tsx
**Location:** `src/pages/dashboard/BillingPage.tsx`

**Features:**
- ✅ Subscription plan management
- ✅ Current plan display with features
- ✅ Plan comparison grid (4 plans)
- ✅ Upgrade/Downgrade functionality
- ✅ Cancel subscription option
- ✅ Confirmation modal for plan changes
- ✅ Demo notice banner
- ✅ Firebase integration for plan storage
- ✅ Visual indicators (badges, icons)

**Plans Available:**
1. **Free Trial** - $0/mo (14-day trial)
   - 10 resumes/month
   - 1 recruiter
   - Basic dashboard

2. **Starter** - $49/mo (For small teams)
   - 50 resumes/month
   - 3 recruiters
   - Full dashboard
   - Basic automations

3. **Pro** - $149/mo (For growing teams) ⭐ Popular
   - 500 resumes/month
   - 10 recruiters
   - Advanced analytics
   - Priority support

4. **Enterprise** - Custom pricing (For large orgs)
   - Unlimited resumes
   - Unlimited users
   - Custom workflows
   - Dedicated support

**Firebase Operations:**
- `getUserById()` - Fetch current plan
- `updateUser()` - Update subscription plan
- `createUser()` - Initialize user with free_trial plan

---

## Technical Stack

### Dependencies Used
- **React** - UI framework
- **Firebase** - Authentication & Firestore database
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components (Dialog, Switch, etc.)
- **Lucide React** - Icons
- **React Router** - Navigation

### Key Hooks
- `useAuth()` - Firebase authentication context
- `useState()` - Local state management
- `useEffect()` - Data fetching on mount
- `toast()` - User notifications

### Components
- Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription
- Button
- Input
- Label
- Switch
- Badge
- Dialog (Modal)
- Icons: Loader2, Save, User, CreditCard, CheckCircle2, ArrowUp, ArrowDown, X

---

## Integration Points

### Firebase Firestore Schema
```typescript
interface FirebaseUser {
  id?: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  plan: string;  // "free_trial" | "starter" | "pro" | "enterprise"
  emailNotifications: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

### Authentication Flow
1. User logs in via Firebase Auth (handled by AuthContext)
2. `user.uid` is used as the document ID in Firestore
3. Profile is fetched/created on page load
4. Updates are persisted to Firestore in real-time

---

## Key Differences from Next.js Version

| Feature | Next.js | React |
|---------|---------|-------|
| Authentication | NextAuth.js | Firebase Auth |
| Database | Mock API routes | Firebase Firestore |
| Routing | App Router | React Router |
| Server Actions | API routes | Direct Firebase calls |
| Session | Server-side | Client-side (Firebase) |
| SSR | Yes | No (CSR only) |

---

## Future Enhancements

### Planned Integrations
- [ ] **Stripe/Razorpay** - Real payment processing
- [ ] **n8n Webhooks** - Automate billing workflows
- [ ] **Email Service** - Send notification emails
- [ ] **Analytics** - Track plan changes and conversions

### Potential Improvements
- [ ] Add payment method management
- [ ] Invoice history display
- [ ] Usage metrics per plan
- [ ] Plan usage warnings (approaching limits)
- [ ] Billing cycle information
- [ ] Promo code support
- [ ] Team member management (Enterprise plan)

---

## Testing Checklist

### Profile Page
- [x] Loads existing profile data
- [x] Creates profile if missing
- [x] Updates name, company, role
- [x] Toggles email notifications
- [x] Shows loading state
- [x] Displays success/error toasts
- [x] Handles unauthenticated users

### Billing Page
- [x] Displays current plan
- [x] Shows all available plans
- [x] Upgrade flow works
- [x] Downgrade flow works
- [x] Cancel subscription works
- [x] Confirmation modal displays
- [x] Plan change persists to database
- [x] Visual indicators (badges, colors)

---

## Notes for Developers

1. **Demo Mode**: Both pages currently use mocked billing. Real payment integration pending.

2. **Auto-Creation**: User profiles are automatically created on first visit if they don't exist.

3. **Toast System**: Uses custom toast hook from `@/components/ui/use-toast`

4. **Styling**: All styles use Tailwind CSS with HSL color variables for theming.

5. **Type Safety**: Full TypeScript support with Firebase types.

6. **Error Handling**: Comprehensive try-catch blocks with user-friendly error messages.

---

## Deployment Considerations

### Vercel Configuration
A `vercel.json` has been created with:
- SPA routing support (rewrites to /index.html)
- Asset caching headers
- Build configuration

### Environment Variables Needed
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## File Structure
```
src/
├── pages/
│   └── dashboard/
│       ├── ProfilePage.tsx ✅ CONVERTED
│       ├── BillingPage.tsx ✅ CONVERTED
│       ├── DashboardPage.tsx
│       └── UploadsPage.tsx
├── contexts/
│   └── AuthContext.tsx (Firebase Auth)
├── lib/
│   ├── firebase.ts
│   └── firebase-db.ts (Firestore operations)
└── components/
    └── ui/ (Shadcn components)
```

---

## Conclusion

Both Profile and Billing pages have been successfully converted from Next.js to React with full Firebase integration. The pages are fully functional, type-safe, and ready for production use with proper payment gateway integration.

**Status**: ✅ Complete and Production-Ready (pending payment integration)