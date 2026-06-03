# SEO Audit Report: buykarlo.in
*Prepared on: June 3, 2026*

This report contains a comprehensive SEO audit of **buykarlo.in** (Aligarh Muslim University student marketplace) using Google Search Console diagnostics, server header traces, PageSpeed Insights (Core Web Vitals), and DataForSEO rank tracking.

---

## 🚨 Critical Visibility Blockers (Fix Immediately)

### 1. Cached "Blocked by robots.txt" Status in Google Search
* **Status**: `NEUTRAL` (Not Indexed)
* **Error**: `Blocked by robots.txt` (Robots.txt state: `DISALLOWED`)
* **Analysis**: Although your current live [robots.txt](https://www.buykarlo.in/robots.txt) file correctly allows crawling (`Allow: /`), Google Search Console reports that the last crawler attempt was on **May 7, 2026**, when the site was blocked. Google has cached that old disallowed status and has not re-visited the homepage since then.
* **Impact**: Google is actively refusing to index your homepage and any other pages, making the site completely invisible in search results.

### 2. Canonical URL & Redirect Mismatch
* **Server Redirect**: `https://buykarlo.in` redirects via a `307 Temporary Redirect` to `https://www.buykarlo.in` (with `www`).
* **Canonical Tag**: The page HTML on `https://www.buykarlo.in` declares its canonical link as:
  ```html
  <link rel="canonical" href="https://buykarlo.in" />
  ```
* **Analysis**: This is a direct canonical conflict. Your server redirects users and search bots to the `www` version, but your code tells Google that the non-`www` version is the official (canonical) version. 
* **Impact**: This confuses search crawlers, wastes crawl budget, and can lead to indexation errors or split page authority.

---

## 📈 Performance & Core Web Vitals Audit
We ran a Mobile Lighthouse performance audit using the PageSpeed API.

| Metric | Measured Value | Rating | Target |
| :--- | :--- | :--- | :--- |
| **Largest Contentful Paint (LCP)** | **5.3 seconds** | 🔴 Poor | < 2.5 seconds |
| **Cumulative Layout Shift (CLS)** | **0.043** | 🟢 Good | < 0.1 |
| **Total Blocking Time (TBT)** | **60 ms** | 🟢 Good | < 200 ms |

* **Analysis**: The website has excellent layout stability (CLS) and minimal Javascript thread blocking (TBT). However, the page takes **5.3 seconds** to render its largest visual element on mobile. Since Google uses mobile-first indexing, this slow LCP is hurting user experience and ranking potential.

---

## 🔍 On-Page SEO Analysis

### 1. Title & Meta Description (Strong)
* **Title Tag**: `BuyKarlo | AMU Student Marketplace` 🟢
* **Meta Description**: `Buy and sell books, electronics, cycles, and hostel essentials with verified students at Aligarh Muslim University. Campus-first deals, direct chat, and safer local meetups.` 🟢
* **Verdict**: These are well-written, fall within character limits, and use highly relevant geo-targeted/audience keywords ("AMU", "Aligarh Muslim University", "student marketplace").

### 2. Heading Structure (Needs Improvement)
* **H1 Tag**: `Browse the best campus deals before someone else does.`
* **H2 Tag**: `Frequently Asked Questions`
* **Analysis**: While the H1 tag works as a student call-to-action, it lacks search keywords. Google relies heavily on H1 tags to determine the topic of a page.
* **Recommendation**: Optimize the H1 tag to include core keywords (e.g. `Buy & Sell Hostel Essentials in Aligarh Muslim University (AMU)`). Add H2 tags for product categories on the homepage (e.g., `Popular Books for Sale`, `Electronics & Bicycles near AMU`).

---

## 📊 Keyword Rankings (India)
We tracked ranks for both generic and branded keywords. All checked terms currently rank **+10** (not in the top 10 positions) because the homepage is completely blocked from the Google Index by the robots.txt issue:

* `karlo` — **+10** (Organic & AI Search)
* `buy karlo` — **+10** (Organic & AI Search)
* `buykarlo` — **+10** (Organic & AI Search)
* `shopping online` — **+10**
* `ecommerce india` — **+10**

---

## 🛠️ Step-by-Step Action Plan

### Step 1: Force Google to Update the Robots.txt Cache
Since you have already updated your `robots.txt` file, you need to tell Google to re-fetch it immediately:
1. Log in to [Google Search Console](https://search.google.com/search-console).
2. Use the **Robots.txt Tester** tool (or search for "Search Console robots.txt tester" in Google).
3. Paste your current `robots.txt` URL: `https://www.buykarlo.in/robots.txt`.
4. Click **Submit** in the bottom-right, then click **Request Recrawl** to force Google to clear its cached disallowed state.

### Step 2: Fix the Canonical Tag Mismatch
Update the canonical tag in your Next.js application metadata.
* **If you want `www` as the primary address**: Change the canonical URL in the code to point to `https://www.buykarlo.in` instead of `https://buykarlo.in`.
* **If you want non-`www` as primary**: Change your hosting/DNS redirects so that `www` redirects to `https://buykarlo.in`, instead of the other way around.

### Step 3: Trigger a Manual Re-Index in GSC
Once Steps 1 and 2 are done, trigger a manual crawl:
1. In Google Search Console, paste `https://www.buykarlo.in` into the top search bar (URL Inspection).
2. Click **Request Indexing**. Since the page is no longer blocked by the live robots.txt, Googlebot will crawl and index the page within 24–48 hours.

### Step 4: Optimize Heading Hierarchy
Update the homepage HTML to include keyword-rich headings:
* Change the H1 to include keyword context (e.g. `AMU Student Marketplace - Buy & Sell Campus Essentials`).
* Add H2 tags for your product category sliders (e.g., `Bicycles & Cycles`, `Hostel Decor & Essentials`, `AMU Books & Materials`).

### Step 5: Improve LCP (Largest Contentful Paint)
To drop your mobile render speed below 2.5 seconds:
* **Image Optimization**: Ensure the hero image (e.g. `buykarlo-campus-trust.png`) is compressed, loaded using Next.js `next/image` with `priority` set to `true` (so it preloads), and uses modern formats (WebP).
* **Font Loading**: Add `display: swap` to your CSS `@font-face` declarations to prevent render-blocking text layout calculations.
* **Next.js SSR Cache**: If the homepage pulls dynamic listings from your database, implement Incremental Static Regeneration (ISR) or static caching so the server responds instantly instead of generating the HTML on every single request.
