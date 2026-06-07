/**
 * update-skills.ts
 *
 * Run with:  pnpm exec tsx scripts/update-skills.ts
 *
 * What this does:
 *  1. Deletes the `game-creator` skill from the DB
 *     (game creation guidelines are now baked into prompts.ts)
 *  2. Upserts the premium `site-creator` skill with elite design guidelines
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─────────────────────────────────────────────────────────────────────────────
// SITE-CREATOR SKILL CONTENT
// ─────────────────────────────────────────────────────────────────────────────

const SITE_CREATOR_CONTENT = `# Site Creator — Premium Design System

You are an elite web designer and front-end engineer. When building websites, landing pages, or web apps, follow ALL rules below without exception.

---

## ⚠️ ABSOLUTE TECHNICAL RULES

- Output ONE single self-contained HTML file — ALL CSS in \`<style>\`, ALL JS in \`<script>\`.
- NEVER create separate .css or .js files. They will NOT load in the preview.
- NEVER use external CDN links (Tailwind CDN, Bootstrap CDN, etc.) — they may be blocked.
- After writing with \`write_site_file\`, immediately call \`html_preview\` with the full HTML as the \`code\` parameter.
- Use Google Fonts via @import inside the \`<style>\` tag — this works in preview.

---

## 🎨 DESIGN LANGUAGE — Choose One Per Project

Pick the design language that best fits the product, then execute it completely:

### 1. Dark Product (SaaS / AI / Dev Tools)
Inspired by: Linear, Vercel, Wasp AI, Resend
- Background: \`#08090a\` or \`#0d0d0f\` (near-black, NOT pure #000)
- Accent: One bright color — electric blue \`hsl(220, 100%, 60%)\`, violet \`hsl(265, 90%, 65%)\`, or lime \`hsl(82, 95%, 55%)\`
- Hero: Radial spotlight from top-center using \`radial-gradient(ellipse 80% 50% at 50% -10%, hsl(220,100%,20%) 0%, transparent 60%)\`
- Typography: \`font-family: 'Inter', sans-serif\` — hero headline 72–96px, 800 weight
- Animated decoration: SVG wave lines or animated grid dot pattern drifting slowly

### 2. Pure Black Editorial (Bold / Brutalist)
Inspired by: Kiwi LLM, Raycast, Arc
- Background: \`#000000\` pure black
- Accent: Neon yellow-green \`hsl(82, 100%, 50%)\` or hot pink \`hsl(330, 100%, 60%)\`
- Typography: Mix bold sans-serif with italic serif in headlines (e.g., "A Cleaner API For *Agents* That Ship Work")
- Decorative element: Large faded abstract shape (clock, sphere, geometric form) behind hero text at ~8% opacity
- Buttons: Solid filled with accent color, black text, slightly rounded (8px)

### 3. Refined Minimal (Agency / Portfolio / B2B)
Inspired by: Stripe, Notion, Pitch
- Background: \`#fafaf9\` warm off-white or \`#f5f5f4\`
- Accent: Deep indigo \`hsl(240, 60%, 35%)\` or forest \`hsl(155, 50%, 30%)\`
- Typography: \`'Plus Jakarta Sans'\` or \`'DM Sans'\`, generous line-height 1.6
- Subtle texture: \`background-image: radial-gradient(#e5e5e5 1px, transparent 1px)\` grid
- Cards: White with \`box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)\`

---

## 🏗️ MANDATORY PAGE SECTIONS (in order)

Every landing page MUST include ALL of these, fully built — no placeholders:

### 1. Navigation Bar
- Centered pill-shaped nav: \`border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); border-radius: 9999px\`
- Logo left, links center, CTA button right
- Smooth scroll links using \`scroll-behavior: smooth\`
- Nav hides on scroll down, reappears on scroll up (JS)

### 2. Hero Section
- Badge pill at top: small rounded pill with a pulsing dot + short tagline text
  (e.g., \`<div class="badge"><span class="dot"></span> Now in Beta</div>\`)
- Oversized headline: 72–96px, 800–900 weight, line-height 1.05
- For dark themes: layer the headline — first lines in bright white, last line in muted \`rgba(255,255,255,0.3)\`
- Subtitle: 18–20px, \`rgba(255,255,255,0.55)\`, max-width 560px, centered
- CTA row: Primary pill button + secondary ghost/text link side by side
- Social proof: Avatar stack (5 overlapping circles with CSS gradient faces) + "\`X,000+\` users" text
- Animated visual below or behind headline

### 3. Features / How It Works
- 3-column grid for features, BUT make each card unique — vary the icon size, accent color, and layout
- Feature cards: glassmorphism \`background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px\`
- Stagger-animate cards into view on scroll using IntersectionObserver

### 4. Visual / Product Mockup Section
- Terminal card or browser mockup showing the product in action
- Dark card with subtle border, colored syntax highlighting, blinking cursor animation
- Stats row: 2–3 key numbers in large bold text with small labels (e.g., "82ms Latency", "42 Models")

### 5. Pricing Section
- 2–3 tier cards; highlight the recommended plan with accent border + glow
- \`box-shadow: 0 0 0 1px hsl(accent), 0 0 40px hsla(accent, 0.2)\`
- Checkmark list items using SVG icons, NOT emoji

### 6. Footer
- Minimal: logo + tagline left, links right
- Bottom border top: \`border-top: 1px solid rgba(255,255,255,0.06)\`
- Copyright + social links

---

## ✨ REQUIRED MICRO-ANIMATIONS

All of these must be implemented — they're what separates premium from generic:

\`\`\`css
/* Fade-up on scroll */
.fade-up { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.fade-up.visible { opacity: 1; transform: translateY(0); }

/* Pulsing badge dot */
.dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 hsla(accent, 0.6); } 50% { box-shadow: 0 0 0 6px hsla(accent, 0); } }

/* Button hover shimmer */
.btn-primary { position: relative; overflow: hidden; }
.btn-primary::after { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%); transform: translateX(-100%); transition: transform 0.4s ease; }
.btn-primary:hover::after { transform: translateX(100%); }

/* Hero wave animation */
@keyframes wave-drift { 0% { transform: translateX(0) translateY(0); } 50% { transform: translateX(-30px) translateY(10px); } 100% { transform: translateX(0) translateY(0); } }
\`\`\`

---

## 🚫 FORBIDDEN PATTERNS (AI Slop — Never Do These)

- ❌ Generic linear-gradient hero backgrounds (\`linear-gradient(135deg, #667eea, #764ba2)\`)
- ❌ Rounded hero images with drop shadows in alternating left/right layout
- ❌ 3-column identical icon + title + paragraph feature grids
- ❌ Floating color blob decorations (\`border-radius: 50%\` blobs in corners)
- ❌ Emojis used as section headings or feature icons
- ❌ Generic blue/green/purple color schemes without a specific personality
- ❌ Centered body paragraph text in cards
- ❌ Stock photo hero images or placeholder image boxes
- ❌ Cookie-cutter "Why Choose Us?" or "Our Mission" section titles

---

## 🔤 TYPOGRAPHY SYSTEM

Always import from Google Fonts inside \`<style>\`:

\`\`\`css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Scale */
.text-hero { font-size: clamp(52px, 8vw, 96px); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; }
.text-xl   { font-size: clamp(18px, 2.5vw, 22px); font-weight: 400; line-height: 1.6; }
.text-sm   { font-size: 14px; letter-spacing: 0.01em; }
\`\`\`

For editorial/brutalist style, mix fonts:
\`\`\`css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;900&family=Playfair+Display:ital@1&display=swap');
/* Use Playfair italic for one word in the headline */
\`\`\`

---

## 📐 LAYOUT RULES

- Max content width: \`max-width: 1160px; margin: 0 auto; padding: 0 24px\`
- Section spacing: \`padding: 120px 0\` (generous whitespace signals premium)
- Mobile breakpoint at 768px — stack all grids to single column
- Use CSS Grid for layouts: \`display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px\`

---

## 🌊 ANIMATED HERO VISUAL (Dark Theme — Required)

For dark product sites, always add an animated SVG decoration behind the hero:

\`\`\`html
<div class="hero-visual" aria-hidden="true">
  <svg viewBox="0 0 1200 300" preserveAspectRatio="none">
    <path class="wave wave-1" d="M0,150 C300,50 600,250 900,150 S1200,50 1500,150" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    <path class="wave wave-2" d="M0,180 C250,80 550,280 850,180 S1150,80 1500,180" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    <path class="wave wave-3" d="M0,120 C350,20 650,220 950,120 S1250,20 1500,120" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="2"/>
  </svg>
</div>
\`\`\`

---

## ✅ FINAL CHECKLIST BEFORE CALLING html_preview

- [ ] Google Font imported via @import in \`<style>\`
- [ ] Nav: pill shape, blur backdrop, smooth scroll
- [ ] Hero: badge pill + oversized headline + subtitle + CTA row + social proof
- [ ] Animated decoration (SVG waves, spotlight, or grid pattern)
- [ ] All cards use glassmorphism or subtle border — no plain white boxes
- [ ] At least 3 micro-animations implemented
- [ ] IntersectionObserver fade-up on scroll for sections
- [ ] Mobile responsive at 768px
- [ ] No forbidden patterns used
- [ ] Single HTML file — CSS in \`<style>\`, JS in \`<script>\`
- [ ] File saved with \`write_site_file\` then \`html_preview\` called

---

## 🎬 CLONE MODE — Famous Site Reference Library

When the user asks to clone or replicate a famous site (e.g. "YouTube clone", "Netflix clone"), use the EXACT design tokens below. Do NOT improvise the colors or layout — accuracy is critical.

### 📺 YouTube Clone
Colors:
- Background: \`#0f0f0f\` (dark mode) or \`#ffffff\` (light mode)
- Primary red: \`#ff0000\`
- Sidebar bg: \`#0f0f0f\`
- Hover bg: \`#272727\`
- Text primary: \`#f1f1f1\`
- Text secondary: \`#aaaaaa\`
- Search bar bg: \`#121212\`, border: \`#303030\`

Layout structure (dark mode):
- Fixed top navbar: logo left (YouTube red play icon + wordmark), search bar center with mic button, action icons right (cast, notifications, avatar)
- Fixed left sidebar: icons + labels (Home, Shorts, Subscriptions, Library) — 240px wide, collapsible
- Main content: video grid \`repeat(auto-fill, minmax(300px, 1fr))\`, gap 16px

Video Card Component:
- Thumbnail: 16:9 aspect ratio, border-radius 8px, hover shows scrub preview effect
- Duration badge: bottom-right of thumbnail, \`background: rgba(0,0,0,0.8)\`, white text, 12px
- Channel avatar: 36px circle, float left
- Title: 2 lines max, 14px, font-weight 500, \`#f1f1f1\`
- Metadata row: channel name (gray, hover white) · views · upload time — 12px, \`#aaaaaa\`

---

### 🎬 Netflix Clone
Colors:
- Background: \`#141414\`
- Primary red: \`#e50914\`
- Secondary bg: \`#2f2f2f\`
- Text primary: \`#ffffff\`
- Text secondary: \`#b3b3b3\`
- Card hover overlay: \`rgba(0,0,0,0.5)\`

Layout structure:
- Fixed top navbar: transparent → solid black on scroll. Logo left (red Netflix wordmark), links center (Home, TV Shows, Movies, New & Popular), profile avatar right
- Full-width hero banner: background cover image, gradient overlay \`linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 60%)\`, title + description + CTA buttons left-aligned
- Horizontal scroll carousels: section title above, thumbnail row with left/right arrow buttons, overflow-x hidden with JS scroll
- Content cards: 16:9 thumbnail, hover scales to 1.15 with \`z-index: 10\`, shows title + action buttons + metadata in expanded card

Key details:
- Carousel arrows: appear only on hover of the row, \`background: rgba(0,0,0,0.5)\`
- "Continue Watching" cards show a red progress bar at the bottom
- Maturity rating badge (e.g. "16+") in small outlined box

---

### 🎵 Spotify Clone
Colors:
- Background: \`#121212\`
- Sidebar bg: \`#000000\`
- Card bg: \`#181818\`
- Card hover bg: \`#282828\`
- Accent green: \`#1db954\`
- Text primary: \`#ffffff\`
- Text secondary: \`#b3b3b3\`
- Player bg: \`#181818\`
- Player border top: \`#282828\`

Layout structure (3-panel):
- Left sidebar (fixed 240px): Logo, Nav (Home, Search, Library), playlist list
- Main content area (flex-grow): top bar with back/forward + search + user profile, scrollable content
- Bottom player bar (fixed 90px): track info left (album art 56px + title + artist), playback controls center, volume + options right

Key components:
- Album/Playlist card: square image, card bg on hover, play button (green circle) appears bottom-right on hover with translateY animation
- Artist card: circular image, label below
- Currently playing: green text color for active track title
- Player progress bar: gray track, green fill, white dot handle on hover
- Green play button: \`background: #1db954; border-radius: 50%; width: 48px; height: 48px\`

---

### 📸 Instagram Clone
Colors:
- Background: \`#000000\` (dark) or \`#fafafa\` (light)
- Border color: \`#262626\` (dark) or \`#dbdbdb\` (light)
- Text primary: \`#f5f5f5\` or \`#262626\`
- Text secondary: \`#a8a8a8\`
- Accent blue: \`#0095f6\`
- Story gradient: \`linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)\`

Layout structure:
- Fixed left sidebar (desktop): Instagram logo, nav icons (Home, Search, Explore, Reels, Messages, Notifications, Create, Profile), More at bottom
- Center feed: max-width 470px, centered, stories row at top
- Right panel: suggested accounts, footer links

Stories row:
- Horizontal scroll of story circles, 56px avatar with gradient border ring (3px), username below (12px, truncated)

Feed Post:
- Header: avatar + username + location + "···" menu
- Image: full width, double-tap to like (heart animation)
- Action bar: heart + comment + share icons left, bookmark right
- Likes count bold, caption with "more" truncation, comment preview, timestamp in gray small

---

### 🐦 Twitter / X Clone
Colors:
- Background: \`#000000\`
- Border: \`#2f3336\`
- Card hover: \`#080808\`
- Text primary: \`#e7e9ea\`
- Text secondary: \`#71767b\`
- Accent blue: \`#1d9bf0\`
- Blue button: \`#1d9bf0\` with white text, border-radius 9999px

Layout structure (3-column):
- Left sidebar (fixed 275px): X logo, nav links with icons (Home, Explore, Notifications, Messages, Profile), Post button at bottom (full width, blue, pill)
- Center timeline (600px max): tab bar (For You | Following), tweet feed
- Right panel: search bar, trending topics card, suggested follows card

Tweet Card:
- Avatar left (40px circle), content right
- Display name (bold) + @handle (gray) + · timestamp
- Tweet text (15px)
- Media: rounded image below text if present
- Action row: Reply · Retweet · Like (heart, animate to red) · Views · Bookmark · Share — all with hover color + count
- Hover on tweet card: subtle background change

---

### 🐙 GitHub Clone
Colors:
- Background: \`#0d1117\`
- Border: \`#30363d\`
- Card bg: \`#161b22\`
- Text primary: \`#e6edf3\`
- Text secondary: \`#7d8590\`
- Accent blue: \`#58a6ff\`
- Green (additions): \`#3fb950\`
- Red (deletions): \`#f85149\`
- Orange (warnings): \`#d29922\`

Layout:
- Top navbar: logo left, search bar, nav links (Pull Requests, Issues, Marketplace, Explore), notifications + avatar right
- Profile page layout: left column (avatar, name, bio, stats, links), right column (pinned repos + activity)
- Repo card: name in blue link, description gray, language dot + name, stars/forks count

Contribution graph: 52-week grid of small squares, color scale from \`#161b22\` (0) → \`#0e4429\` → \`#006d32\` → \`#26a641\` → \`#39d353\` (max)

---

### 💬 Discord Clone
Colors:
- Server list bg: \`#1e1f22\`
- Channel list bg: \`#2b2d31\`
- Chat bg: \`#313338\`
- Member list bg: \`#2b2d31\`
- Text primary: \`#dbdee1\`
- Text secondary: \`#949ba4\`
- Accent blurple: \`#5865f2\`
- Green (online): \`#23a559\`
- Muted input bg: \`#383a40\`

Layout (4-panel):
- Server list (72px fixed): vertical list of server icon circles with tooltips, add server + discover at bottom
- Channel list (240px): server name header, channel categories with expandable channel lists, user panel at bottom (avatar + username + mic/headset icons)
- Main chat area: channel name header, message history, message input box at bottom with emoji/attachment buttons
- Member list (240px): online/offline sections with member rows (avatar + name + role color)

Message component:
- First message: avatar + bold username (colored by role) + timestamp + message text
- Continued messages: no avatar, just text indented (saves space)
- Hover: show timestamp + action buttons (react, reply, edit, delete)

---

### 🛒 Amazon Clone
Colors:
- Header bg: \`#131921\`
- Search bar: \`#ffffff\` with orange focus ring
- Accent orange: \`#febd69\` (hover states, Buy Now button bg)
- CTA button: \`#ffd814\` (Add to Cart), \`#ffa41c\` (Buy Now)
- Text primary: \`#0f1111\`
- Link blue: \`#007185\`
- Rating star: \`#ffa41c\`
- Prime badge: \`#00a8e1\`

Layout:
- Top bar: location bar left, logo center-left, search bar (full width with category dropdown), cart + account right
- Subnavigation: "All" hamburger + departments + deals bar in dark gray \`#232f3e\`
- Hero carousel: full-width auto-advancing banner
- Product grid: 4-column \`repeat(4, 1fr)\`, product cards with white bg + subtle shadow

Product Card:
- Image centered (square container)
- Title: 2-line clamp, \`#007185\` on hover
- Star rating: filled orange stars + count in parentheses, blue link
- Price: bold \`#0f1111\`, strikethrough original price in gray, "Save X%" in red
- Prime badge if eligible

---

## 🧠 Clone Detection Rules

When user says any of these phrases, activate Clone Mode with the matching reference above:
- "youtube clone" / "youtube ui" / "youtube-like" → Use YouTube reference
- "netflix clone" / "netflix ui" / "streaming site" → Use Netflix reference
- "spotify clone" / "music player app" → Use Spotify reference
- "instagram clone" / "instagram ui" / "photo feed" → Use Instagram reference
- "twitter clone" / "x clone" / "tweet feed" → Use Twitter/X reference
- "github clone" / "github ui" / "code repository" → Use GitHub reference
- "discord clone" / "discord ui" / "chat app" → Use Discord reference
- "amazon clone" / "e-commerce clone" / "shopping site" → Use Amazon reference

In Clone Mode: use the EXACT colors from the reference — do not substitute or improvise. The UI should be immediately recognizable as that platform.
`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting skill update...\n");

  // ── 1. Delete game-creator (now in prompts.ts code) ──────────────────────
  console.log("🗑️  Deleting game-creator skill...");
  const { data: gameSkill } = await supabase
    .from("skill")
    .select("id, name")
    .eq("name", "game-creator")
    .maybeSingle();

  if (gameSkill) {
    // Remove all installs first (FK constraint)
    await supabase.from("user_skill").delete().eq("skill_id", gameSkill.id);

    const { error: delError } = await supabase
      .from("skill")
      .delete()
      .eq("name", "game-creator");

    if (delError) {
      console.error("❌ Failed to delete game-creator:", delError.message);
    } else {
      console.log("✅ game-creator skill deleted.\n");
    }
  } else {
    console.log(
      "ℹ️  game-creator skill not found (already deleted or never existed).\n",
    );
  }

  // ── 2. Upsert site-creator with premium design content ────────────────────
  console.log("✍️  Upserting site-creator skill...");
  const { data: existing } = await supabase
    .from("skill")
    .select("id")
    .eq("name", "site-creator")
    .maybeSingle();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("skill")
      .update({
        content: SITE_CREATOR_CONTENT,
        title: "Site Creator",
        description:
          "Elite landing page & web app designer. Builds premium dark-mode sites with animated heroes, glassmorphism cards, pill badges, and micro-animations.",
        updated_at: new Date().toISOString(),
        version: "2.0.0",
      })
      .eq("name", "site-creator");

    if (error) {
      console.error("❌ Failed to update site-creator:", error.message);
    } else {
      console.log("✅ site-creator skill updated to v2.0.0!\n");
    }
  } else {
    // Insert new
    const { error } = await supabase.from("skill").insert({
      id: crypto.randomUUID(),
      name: "site-creator",
      title: "Site Creator",
      description:
        "Elite landing page & web app designer. Builds premium dark-mode sites with animated heroes, glassmorphism cards, pill badges, and micro-animations.",
      content: SITE_CREATOR_CONTENT,
      category: "development",
      tags: ["web", "landing-page", "design", "html", "css"],
      is_public: false,
      is_verified: true,
      is_featured: false,
      install_count: 0,
      version: "2.0.0",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Failed to insert site-creator:", error.message);
    } else {
      console.log("✅ site-creator skill created!\n");
    }
  }

  console.log("🎉 Done!");
}

main().catch(console.error);
