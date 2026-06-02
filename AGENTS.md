<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BuyKarlo 2.0 - Codebase Context & Developer Guide

Welcome! This file provides a comprehensive overview of the **BuyKarlo 2.0** campus marketplace project to help you resume development efficiently.

---

## 1. Project Concept
BuyKarlo 2.0 is a trust-scaped, campus-scoped peer-to-peer (P2P) student marketplace designed for **Aligarh Muslim University (AMU)**.
- **Goal**: Allow students to securely list, negotiate, and trade campus gear (books, cycles, electronics, dorm decor) within verified university networks.
- **Safety**: Standardized on university verification (e.g., department, campus location tags) and a gamified **Trust Score** points system.

---

## 2. Technology Stack & Configuration
- **Frontend Framework**: Next.js 16.2.6 (using Turbopack compiler)
- **Styling**: Tailwind CSS with custom theme properties (Electric Indigo `#1C16CF` / Violet `#6B38D4` brand gradients, glassmorphism panel styles) defined in [globals.css](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/globals.css) and registered in [next.config.ts](file:///Users/ayush/Downloads/buykarlo%202.0/next.config.ts).
- **Backend Architecture**: Serverless. All API actions run via Supabase Client actions and Next.js Server Actions. Do **NOT** introduce Express or secondary servers.
- **Database / Auth**: Supabase (PostgreSQL with Row-Level Security enabled).
- **Storage**: Cloudflare R2 bucket storage integrated with pre-signed PUT URLs. All R2 media is served with long-lived browser/CDN caching headers (`Cache-Control: public, max-age=31536000, immutable`).

---

## 3. Core Database Tables (Supabase)
- **`public.profiles`**: Contains user info (`id` references auth.users), `email`, `full_name`, `avatar_url`, `university`, `department`, `trust_score`, `phone`, and `phone_verified`.
- **`public.listings`**: Stores item data. Status column uses enum: `('active', 'sold', 'hidden', 'deleted', 'pending_review')`. Category relationships map through `category_id`.
- **`public.categories`**: Holds marketplace categories. Whitelisted tags include: `electronics`, `books`, `cycles`, and `dorm-decor`.
- **`public.listing_images`**: Maps R2 storage bucket URLs to listing IDs.
- **`public.conversations` & `public.messages`**: Handles real-time student negotiations. A database trigger automatically syncs conversation timestamps on new message insertion.

---

## 4. Key Developer Modules
1. **Onboarding Guard & Redirect**:
   - Handled inside [proxy.ts](file:///Users/ayush/Downloads/buykarlo%202.0/src/proxy.ts). Logged-in users who haven't completed onboarding profiles (with phone and full name) are automatically forced onto `/onboarding`.
2. **Authentication Flow (Frictionless / Stitch System)**:
   - Split-screen premium layout wrapper: [AuthLayout.tsx](file:///Users/ayush/Downloads/buykarlo%202.0/src/components/auth/AuthLayout.tsx).
   - Minimal Friction Sign Up: `register/page.tsx` takes email, verifies it via email OTP first, then redirects to onboarding.
   - Credentials + Passcode Login: `login/page.tsx` supports Email + Password as primary and passwordless OTP verification as secondary.
   - Eye toggles for password visibility: Included in all password forms (Login, Onboarding, Reset Password, and the inline AuthModal).
   - Inline Action Auth Interception: Unlogged users who click "Chat with Seller", "Make an Offer", or the wishlist "Heart icon" are prompted with a sleek modal popup `AuthModal` to log in inline. On successful login, the action is automatically resumed without page redirects.
   - Password Recovery: `forgot-password/page.tsx` requests a reset email; `reset-password/page.tsx` updates it via auth callback `src/app/auth/callback/route.ts`.
3. **Product Upload Route (`/sell`)**:
   - Fetches upload URLs via a pre-signed handler at [route.ts](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/api/storage/presign/route.ts) and uploads raw binary images directly to Cloudflare R2 before recording URLs to `listing_images` table.
4. **Seller Dashboard (`/dashboard`)**:
   - Implemented as a bento card layout at [page.tsx](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/(protected)/dashboard/page.tsx). It lets sellers pause listings (deactivate), resume them, mark as sold (increments earnings calculations), delete them, and links listing rows to chat negotiations.
5. **Marketplace Feed (`/`)**:
   - Loads dynamic list items directly from Supabase via `getActiveListings()` server action inside [page.tsx](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/(marketplace)/page.tsx).
   - Features functional client-side pagination (`ITEMS_PER_PAGE = 6`) with dynamic ellipses (`1 2 3 ... 12`), filter-change auto-reset indexing, and scroll-to-grid ref triggers to optimize rendering weight.
6. **Trust Score & Verification Systems**:
   - Initial user score is set to `50`.
   - Verification Hub on user profile ([ProfileClient.tsx](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/(protected)/profile/ProfileClient.tsx)) allows:
     * College Institutional Email verification code simulation (**+20 points** to trust score).
     * Student ID Card photo upload to R2 (`/api/storage/presign` with `{ type: "id_card" }` payload) generating a pending request in `public.verifications`.
   - Admin Queue (`/admin/verifications`): Allows admin validation. Approving ID verifications awards **+30 points** to user's trust score and sets profile to `"verified"`.
   - Deal Completion Boost: Marking a listing as "sold" awards **+5 points** to the seller's trust score (capped at 100).
7. **Database Read Caching & Consistency**:
   - Marketplace public queries in `getActiveListings` are cached in server memory using Next.js `unstable_cache` with tag `"active-listings"`.
   - Utilizes a cookieless Supabase server client `createPublicClient` for fetching lists to prevent Next.js from throwing static page pre-render/cookie error warnings inside the cached block.
   - Writing/mutating database actions (`createListing`, `updateListing`, `updateListingStatus`, `deleteListing`) explicitly trigger `updateTag("active-listings")` to invalidate the cache instantly, guaranteeing read-your-own-writes consistency.

---

## 5. Critical Guidelines & Best Practices
- **Next.js Image Whitelist**: Whenever whitelisting new image domains, configure them inside `images.remotePatterns` in [next.config.ts](file:///Users/ayush/Downloads/buykarlo%202.0/next.config.ts). Currently, Google avatars and Cloudflare R2 subdomains are authorized.
- **Next.js Responsive Sizing**: Always declare responsive `sizes` attributes (e.g. `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"`) on grid elements that load filled `<Image>` components to avoid unnecessary high-res image transfer egress.
- **Media Preloading Prevention**: Block automatic browser video buffering by explicitly declaring `preload="none"` on static thumbnail preview `<video>` components.
- **Frictionless Onboarding**: WhatsApp OTP checks are disabled. Phone numbers are verified natively directly inside `/onboarding` without external gateways to prevent SMS bottlenecks.
- **Supabase Relation Joins**: Supabase relationships on 1-to-1 queries (e.g. `user:user_id(...)`) can return arrays instead of objects in JS. Parse properly using `Array.isArray(v.user) ? v.user[0] : (v.user || null)`.
- **OTP verification types**: When using `verifyOtp` to verify code sent via `signInWithOtp` (passwordless login), make sure to specify type `"email"`.
- **Next.js 16 Cache Expiry**: When clearing cache tags on Server Actions, use `updateTag("tag-name")` for immediate consistency, or `revalidateTag("tag-name", "max")` for background revalidation.
- **Compilation Check**: Before committing your code, always test the production assembly:
  ```bash
  npm run build
  ```
  Ensure TypeScript and page rendering complete with zero compile errors.
