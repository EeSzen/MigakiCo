# MIGAKI — Motorcycle Detailing Marketing & Booking Website

Welcome to the Migaki project! This is a modern, luxury-focused marketing and booking website for appointment-only motorcycle detailing services.

## 🎯 Project Overview

Migaki is a single-page marketing website built with:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **Hosting**: Vercel
- **Styling**: Dark-first design with maroon accent color

### Brand Identity
- **Tagline**: "Precision, quietly applied."
- **Tone**: Premium, technical, refined — closer to luxury hardware than a typical car wash
- **Philosophy**: Appointment-only, home-based, product-driven detailing for discerning riders

---

## 📋 Features & Sections

### Homepage Sections (In Order)
1. **Hero** — Full-screen cinematic introduction with primary CTA
2. **About** — Three-column value proposition cards
3. **Services & Packages** — Grid of service tiers with pricing and features
4. **Booking Preview** — Live slot selector (teaser to full booking flow)
5. **Process** — Step-by-step workflow visualization
6. **Gallery** — Before/after image slider
7. **Reviews** — Customer testimonials
8. **FAQ** — Accordion with common questions
9. **Footer/Contact** — Links, service area info, secondary CTA

### Core Features
- ✨ **Fixed Navigation** — Blur-on-scroll effect, responsive mobile menu
- 🎨 **Dark-First Design** — Near-black backgrounds with minimal accent usage
- 📅 **Booking Preview** — Day/time selector with availability
- 🖼️ **Gallery Comparison** — Before/after slider for bike details
- 📱 **Fully Responsive** — Desktop, tablet, mobile optimized
- ⚡ **Smooth Scrolling** — Anchor-link navigation throughout
- 🎬 **Cinematic Animations** — Scroll effects, hover states, transitions

---

## 🛠️ Tech Stack Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/migaki.git
cd migaki

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables

Create a `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Development

```bash
# Start dev server (hot reload)
npm run dev

# Open http://localhost:5173 in your browser
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
vercel deploy
```

---

## 🎨 Design System

### Color Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--bg-primary` | Dark Void | `#0E0E0F` | Primary background |
| `--accent` | Dark Maroon | `#390007` | CTAs, active states, highlights |
| `--accent-bright` | Bright Maroon | `#7A1120` | Hover/active states (30% lighter) |
| `--surface` | Surface | `#1A1A1B` | Cards, panels |
| `--text-primary` | Maui Mist | `#F0F4F5` | Primary text |
| `--text-secondary` | Shining Knight | `#9BA0AB` | Secondary/muted text |
| `--border` | Border | `rgba(155, 160, 171, 0.15)` | Hairline dividers |

### Typography

- **Headlines**: Playfair Display (serif, large scale)
- **Body/UI**: Inter (sans-serif, clean & modern)
- **Rule**: Never use serif in UI chrome (buttons, nav, forms)

### Layout Rules

- No shadows on dark backgrounds — use hairline borders instead
- Maximum one accent color on screen at a time
- Generous vertical spacing (Lamborghini-style breathing room)
- Cards use `--surface` tone with 1px borders

---

## 📁 Project Structure

```
migaki/
├── src/
│   ├── components/           # React components
│   │   ├── Navbar.tsx        # Fixed top navigation
│   │   ├── Hero.tsx          # Hero section
│   │   ├── About.tsx         # Value propositions
│   │   ├── Services.tsx      # Service cards
│   │   ├── BookingPreview.tsx # Slot picker
│   │   ├── Process.tsx       # Process timeline
│   │   ├── Gallery.tsx       # Before/after slider
│   │   ├── Reviews.tsx       # Testimonials
│   │   ├── FAQ.tsx           # Accordion
│   │   ├── Footer.tsx        # Contact & footer
│   │   └── *.css             # Component styles
│   ├── lib/
│   │   └── supabase.ts       # Supabase client config
│   ├── App.tsx               # Main app component
│   ├── App.css               # App-level styles
│   ├── index.css             # Global styles & Tailwind directives
│   └── main.tsx              # Entry point
├── public/                   # Static assets
├── .env.example              # Example environment variables
├── package.json
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

---

## 🔄 Component Architecture

### Navbar
- Fixed position, blur-on-scroll effect
- Links to all sections (Home, Services, Gallery, Process, Reviews, FAQ, Contact)
- "Book Now" CTA button (maroon)
- Mobile hamburger menu

### Hero
- Full-bleed background with gradient overlay
- Large serif headline + sans-serif subheadline
- Primary CTA (Book Now) + secondary (View Services)
- Scroll hint animation at bottom

### Services
- Responsive grid (3-up desktop, 1 mobile)
- Featured/recommended badge on bundle
- Price, duration, feature bullets for each service
- "Book Service" CTA per card

### Booking Preview
- Mini calendar showing next 14 days (excluding Sundays)
- Time slot selector (5 slots per day, sample data)
- "Continue to Booking" button (links to full booking flow)

### Gallery
- Before/after image comparison slider
- Navigation arrows + image counter
- Dot indicators for image selection
- Bike name caption

### FAQ
- Accordion with 6 common questions
- Smooth expand/collapse animation
- Hover effects on question text

---

## 📞 Next Steps

- [ ] Connect real Supabase booking backend
- [ ] Implement real-time slot locking (prevent double-booking)
- [ ] Add contact form integration
- [ ] Build admin dashboard for booking management
- [ ] Set up SMS/email confirmation flow
- [ ] Create separate booking page routes
- [ ] Replace gallery placeholder images with real bikes
- [ ] Wire up customer reviews from database
- [ ] Implement customer account system
- [ ] Add loyalty program

---

## 📄 License

© 2024 Migaki. All rights reserved.

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
