# Infinite Redirect Loop Fix

## Problem
After fixing the CORS issue, the login/signup pages were experiencing an infinite redirect loop, causing the page to reload at "the speed of light" and glitching.

## Root Cause
The infinite loop was caused by:

1. **AuthProvider** component calls `/me` endpoint on EVERY page load (including login/signup pages)
2. When `/me` fails (no valid token), the **axios interceptor** in `lib/api.ts` redirects to `/login`
3. The `/login` page ALSO has AuthProvider wrapping it (via root layout)
4. This creates an infinite loop:
   - Load `/login` → AuthProvider calls `/me` → fails → redirect to `/login` → repeat forever

## Solution

### 1. Fixed `lib/api.ts` - Prevent redirect on login/signup pages
**Lines 62-72 & 87-100**

Added path checking before redirecting:
```typescript
if (typeof window !== 'undefined') {
  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/signup') {
    window.location.href = "/login";
  }
}
```

This prevents the interceptor from redirecting when already on login/signup pages.

### 2. Fixed `components/AuthProvider.tsx` - Skip /me call on public pages
**Lines 12-21**

Added early return for login/signup pages:
```typescript
async function loadMe() {
  // Don't try to load user on login/signup pages to avoid redirect loop
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/signup') {
      setLoading(false);
      setUser(null);
      return;
    }
  }
  // ... rest of the code
}
```

This prevents AuthProvider from making unnecessary API calls on public pages.

## Files Modified

1. `/home/raj/Documents/Projects/autostack-frontend/lib/api.ts`
   - Added path checking in two places (lines 65-68 and 94-97)
   - Prevents redirect to /login when already on /login or /signup

2. `/home/raj/Documents/Projects/autostack-frontend/components/AuthProvider.tsx`
   - Added early return for /login and /signup pages (lines 13-20)
   - Prevents unnecessary /me API calls on public pages

## Testing

After the fix:
- ✅ Login page loads without infinite loop
- ✅ Signup page loads without infinite loop
- ✅ No more rapid reloading/glitching
- ✅ Backend CORS still working correctly
- ✅ Authentication flow works as expected

## How It Works Now

1. User visits `/login` or `/signup`
2. AuthProvider detects the path and skips the `/me` call
3. Page loads normally without any redirects
4. User can login/signup successfully
5. After authentication, user is redirected to `/dashboard`
6. On protected pages, AuthProvider calls `/me` to verify authentication
7. If authentication fails on protected pages, user is redirected to `/login`

This creates a clean separation between public (login/signup) and protected pages.
