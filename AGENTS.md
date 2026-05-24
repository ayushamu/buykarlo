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
- **Storage**: Cloudflare R2 bucket storage integrated with pre-signed PUT URLs.

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
2. **Product Upload Route (`/sell`)**:
   - Fetches upload URLs via a pre-signed handler at [route.ts](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/api/storage/presign/route.ts) and uploads raw binary images directly to Cloudflare R2 before recording URLs to `listing_images` table.
3. **Seller Dashboard (`/dashboard`)**:
   - Implemented as a bento card layout at [page.tsx](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/(protected)/dashboard/page.tsx). It lets sellers pause listings (deactivate), resume them, mark as sold (increments earnings calculations), delete them, and links listing rows to chat negotiations.
4. **Marketplace Feed (`/`)**:
   - Loads dynamic list items directly from Supabase via `getActiveListings()` server action inside [page.tsx](file:///Users/ayush/Downloads/buykarlo%202.0/src/app/(marketplace)/page.tsx).

---

## 5. Critical Guidelines & Best Practices
- **Next.js Image Whitelist**: Whenever whitelisting new image domains, configure them inside `images.remotePatterns` in [next.config.ts](file:///Users/ayush/Downloads/buykarlo%202.0/next.config.ts). Currently, Google avatars and Cloudflare R2 subdomains are authorized.
- **Frictionless Onboarding**: WhatsApp OTP checks are disabled. Phone numbers are verified natively directly inside `/onboarding` without external gateways to prevent SMS bottlenecks.
- **Compilation Check**: Before committing your code, always test the production assembly:
  ```bash
  npm run build
  ```
  Ensure TypeScript and page rendering complete with zero compile errors.
