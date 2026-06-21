# INTIFIX - Design System Documentation

## Executive Summary

This design system establishes the visual foundation for INTIFIX, a premium technical services platform. The system is inspired by Airbnb, Uber, Stripe, and Notion to create a trustworthy, professional, and modern experience that positions INTIFIX as a venture-ready startup.

---

## 1. Color System

### Design Philosophy

The color palette is built on a foundation of trust, professionalism, and technology. We use a sophisticated blue-violet primary that conveys reliability and innovation, paired with an extensive neutral scale for clarity and elegance.

### Primary Color: INTIFIX Blue

**Color:** `oklch(0.55 0.22 265)` → #6366F1 (Indigo-500 equivalent)
**Rationale:** 
- Blue-violet combines the trust of blue with the innovation of violet
- Used by Stripe, Linear, and other premium tech companies
- Excellent contrast ratios for accessibility
- Works beautifully in both light and dark modes
- Conveys professionalism without being corporate or boring

**Usage:**
- Primary buttons
- Call-to-action elements
- Brand accents
- Active states
- Links

### Secondary Color: INTIFIX Teal

**Color:** `oklch(0.65 0.15 195)` → #14B8A6 (Teal-500 equivalent)
**Rationale:**
- Teal represents growth, balance, and technology
- Complements the primary blue-violet
- Used by Airbnb for secondary actions
- Softer than pure blue, more approachable
- Excellent for success states and positive feedback

**Usage:**
- Secondary buttons
- Success indicators
- Completed states
- Verification badges
- Positive feedback

### Accent Color: INTIFIX Coral

**Color:** `oklch(0.68 0.18 25)` → #F97316 (Orange-500 equivalent)
**Rationale:**
- Warm accent that draws attention without overwhelming
- Used sparingly for emphasis and conversion
- Creates visual hierarchy
- Represents energy and action
- Complements the cool primary colors

**Usage:**
- Urgent notifications
- Limited-time offers
- Highlighted features
- Warning states
- Conversion elements

### Semantic Colors

#### Success
**Color:** `oklch(0.70 0.18 145)` → #22C55E (Green-500)
**Rationale:** Green universally represents success, completion, and positive outcomes. This shade is vibrant enough to be noticeable but not overwhelming.

**Usage:**
- Success messages
- Completed services
- Verified status
- Positive ratings
- Online indicators

#### Warning
**Color:** `oklch(0.75 0.15 85)` → #EAB308 (Yellow-500)
**Rationale:** Yellow provides clear warning without the alarm of red. It's attention-grabbing but not panic-inducing.

**Usage:**
- Pending states
- Attention needed
- Low urgency notifications
- Incomplete profiles
- Time warnings

#### Error
**Color:** `oklch(0.60 0.20 25)` → #EF4444 (Red-500)
**Rationale:** Red is the universal color for errors and danger. This shade is impactful but not harsh.

**Usage:**
- Error messages
- Failed operations
- Rejected requests
- Critical alerts
- Offline status

### Neutral Scale (50-950)

A comprehensive neutral scale built on OKLCH for perceptual uniformity across light and dark modes.

```css
--neutral-50:  oklch(0.98 0.005 265);  /* #FAFAFA - Near white */
--neutral-100: oklch(0.96 0.005 265);  /* #F5F5F5 - Very light gray */
--neutral-200: oklch(0.94 0.005 265);  /* #E5E5E5 - Light gray */
--neutral-300: oklch(0.90 0.005 265);  /* #D4D4D4 - Medium light */
--neutral-400: oklch(0.82 0.005 265);  /* #A3A3A3 - Medium gray */
--neutral-500: oklch(0.65 0.005 265);  /* #737373 - Medium dark */
--neutral-600: oklch(0.45 0.005 265);  /* #525252 - Dark gray */
--neutral-700: oklch(0.35 0.005 265);  /* #404040 - Very dark */
--neutral-800: oklch(0.25 0.005 265);  /* #262626 - Near black */
--neutral-900: oklch(0.15 0.005 265);  /* #171717 - Almost black */
--neutral-950: oklch(0.09 0.005 265);  /* #0A0A0A - Pure black */
```

**Rationale:**
- Provides 11 steps for fine-grained control
- Maintains consistent hue (265° - slight blue tint for warmth)
- Low chroma (0.005) ensures neutrality
- Perceptually uniform spacing
- Excellent for creating depth and hierarchy
- Works seamlessly in both light and dark modes

**Usage:**
- **50-100:** Backgrounds, cards, subtle dividers
- **200-300:** Borders, input backgrounds, disabled states
- **400-500:** Secondary text, icons, placeholders
- **600-700:** Primary text, headings, active elements
- **800-900:** Emphasis text, dark mode backgrounds
- **950:** Pure black for high contrast elements

### Color Application Guidelines

#### Light Mode (Default)
```css
--background:  oklch(1 0 0);           /* Pure white */
--foreground:  oklch(0.15 0.005 265);  /* neutral-800 */
--card:        oklch(1 0 0);           /* Pure white */
--card-foreground: oklch(0.15 0.005 265);
--primary:     oklch(0.55 0.22 265);   /* INTIFIX Blue */
--primary-foreground: oklch(1 0 0);    /* White */
--secondary:   oklch(0.96 0.005 265);  /* neutral-100 */
--secondary-foreground: oklch(0.15 0.005 265);
--muted:       oklch(0.96 0.005 265);  /* neutral-100 */
--muted-foreground: oklch(0.45 0.005 265); /* neutral-500 */
--accent:      oklch(0.94 0.005 265);  /* neutral-200 */
--accent-foreground: oklch(0.15 0.005 265);
--border:      oklch(0.90 0.005 265);  /* neutral-300 */
--input:       oklch(0.94 0.005 265);  /* neutral-200 */
--ring:        oklch(0.55 0.22 265);   /* INTIFIX Blue */
```

#### Dark Mode
```css
--background:  oklch(0.09 0.005 265);  /* neutral-950 */
--foreground:  oklch(0.98 0.005 265);  /* neutral-50 */
--card:        oklch(0.15 0.005 265);  /* neutral-900 */
--card-foreground: oklch(0.98 0.005 265);
--primary:     oklch(0.65 0.22 265);   /* Lighter INTIFIX Blue */
--primary-foreground: oklch(0.09 0.005 265);
--secondary:   oklch(0.25 0.005 265);  /* neutral-800 */
--secondary-foreground: oklch(0.98 0.005 265);
--muted:       oklch(0.25 0.005 265);  /* neutral-800 */
--muted-foreground: oklch(0.65 0.005 265); /* neutral-400 */
--accent:      oklch(0.35 0.005 265);  /* neutral-700 */
--accent-foreground: oklch(0.98 0.005 265);
--border:      oklch(0.25 0.005 265);  /* neutral-800 */
--input:       oklch(0.25 0.005 265);  /* neutral-800 */
--ring:        oklch(0.65 0.22 265);   /* Lighter INTIFIX Blue */
```

---

## 2. Typography System

### Font Selection: Geist Variable

**Selected Font:** Geist Variable (already installed)

**Rationale for Selection:**

1. **Modern & Clean:** Geist is the font used by Vercel and Linear, representing the cutting edge of tech design
2. **Excellent Readability:** Optimized for screen reading with careful spacing and kerning
3. **Variable Weight:** Single font file with multiple weights, reducing load time
4. **Neutral Personality:** Doesn't compete with content, lets the design shine
5. **Technical Heritage:** Designed for developer tools and technical interfaces
6. **Perfect for INTIFIX:** Aligns with our technical services positioning
7. **Future-Proof:** Actively maintained by Vercel team

**Comparison with Alternatives:**

- **Inter:** Excellent but more generic, used by many SaaS products
- **Plus Jakarta Sans:** Great for enterprise, slightly more formal
- **SF Pro:** Apple's font, not available for web use
- **Geist:** Best choice for a modern tech startup

### Type Scale

A modular scale based on a ratio of 1.25 (major third) for harmonious progression.

```css
--font-xs:   0.75rem;   /* 12px - Captions, labels */
--font-sm:   0.875rem;  /* 14px - Body small, metadata */
--font-base: 1rem;      /* 16px - Body text, default */
--font-lg:   1.125rem;  /* 18px - Body large, emphasis */
--font-xl:   1.25rem;   /* 20px - Subheadings */
--font-2xl:  1.5rem;    /* 24px - Section headings */
--font-3xl:  1.875rem;  /* 30px - Page headings */
--font-4xl:  2.25rem;   /* 36px - Hero headings */
--font-5xl:  3rem;      /* 48px - Display headings */
--font-6xl:  3.75rem;   /* 60px - Large display */
```

### Font Weights

```css
--font-light:   300;  /* Subtle emphasis */
--font-normal:  400;  /* Body text, default */
--font-medium:  500;  /* Emphasis, subheadings */
--font-semibold: 600;  /* Headings, important text */
--font-bold:    700;  /* Strong emphasis */
```

### Line Heights

```css
--leading-none:    1;     /* Tight headings */
--leading-tight:   1.25;  /* Headings */
--leading-snug:    1.375; /* Subheadings */
--leading-normal:  1.5;   /* Body text */
--leading-relaxed: 1.625; /* Long-form content */
--leading-loose:   2;     /* Display text */
```

### Letter Spacing

```css
--tracking-tighter: -0.05em;  /* Large headings */
--tracking-tight:   -0.025em; /* Headings */
--tracking-normal:  0;        /* Default */
--tracking-wide:     0.025em; /* Uppercase, labels */
--tracking-wider:    0.05em;  /* Small uppercase */
--tracking-widest:   0.1em;   /* Special emphasis */
```

### Typography Hierarchy

#### Display Text
```css
font-size: var(--font-5xl);
font-weight: var(--font-bold);
line-height: var(--leading-tight);
letter-spacing: var(--tracking-tight);
```
**Usage:** Hero headings, major announcements

#### H1 - Page Headings
```css
font-size: var(--font-4xl);
font-weight: var(--font-semibold);
line-height: var(--leading-tight);
letter-spacing: var(--tracking-tight);
```
**Usage:** Page titles, main section headings

#### H2 - Section Headings
```css
font-size: var(--font-3xl);
font-weight: var(--font-semibold);
line-height: var(--leading-snug);
letter-spacing: var(--tracking-normal);
```
**Usage:** Section titles, card headings

#### H3 - Subsection Headings
```css
font-size: var(--font-2xl);
font-weight: var(--font-medium);
line-height: var(--leading-snug);
letter-spacing: var(--tracking-normal);
```
**Usage:** Subsection titles, card subtitles

#### Body Large
```css
font-size: var(--font-lg);
font-weight: var(--font-normal);
line-height: var(--leading-normal);
letter-spacing: var(--tracking-normal);
```
**Usage:** Lead paragraphs, emphasized body text

#### Body
```css
font-size: var(--font-base);
font-weight: var(--font-normal);
line-height: var(--leading-normal);
letter-spacing: var(--tracking-normal);
```
**Usage:** Standard body text, descriptions

#### Body Small
```css
font-size: var(--font-sm);
font-weight: var(--font-normal);
line-height: var(--leading-normal);
letter-spacing: var(--tracking-normal);
```
**Usage:** Metadata, timestamps, secondary information

#### Caption
```css
font-size: var(--font-xs);
font-weight: var(--font-medium);
line-height: var(--leading-normal);
letter-spacing: var(--tracking-wide);
text-transform: uppercase;
```
**Usage:** Labels, badges, form field labels

#### Label
```css
font-size: var(--font-xs);
font-weight: var(--font-semibold);
line-height: var(--leading-none);
letter-spacing: var(--tracking-wider);
text-transform: uppercase;
```
**Usage:** Button labels, navigation items, small emphasis

---

## 3. Spacing System

### 8-Point Grid System

All spacing follows an 8-point grid for consistency and rhythm.

```css
--space-0:   0;
--space-1:   0.25rem;  /* 4px */
--space-2:   0.5rem;   /* 8px */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px */
--space-5:   1.25rem;  /* 20px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
--space-20:  5rem;     /* 80px */
--space-24:  6rem;     /* 96px */
--space-32:  8rem;     /* 128px */
```

### Spacing Guidelines

#### Component Internal Spacing
- **Tight:** 4-8px (buttons, badges, small cards)
- **Comfortable:** 12-16px (form inputs, standard cards)
- **Generous:** 24-32px (large cards, sections)

#### Section Spacing
- **Between sections:** 64-96px
- **Within sections:** 32-48px
- **Mobile sections:** 32-48px

#### Container Padding
- **Mobile:** 16-20px
- **Tablet:** 24-32px
- **Desktop:** 32-48px
- **Large Desktop:** 48-64px

---

## 4. Border Radius System

### Radius Scale

```css
--radius-none:   0;
--radius-sm:     0.25rem;  /* 4px - Small elements */
--radius-md:     0.375rem; /* 6px - Buttons, inputs */
--radius-lg:     0.5rem;   /* 8px - Cards, standard */
--radius-xl:     0.75rem;  /* 12px - Large cards */
--radius-2xl:    1rem;     /* 16px - Modals, hero elements */
--radius-3xl:    1.5rem;   /* 24px - Special elements */
--radius-full:   9999px;   /* Pills, badges, avatars */
```

### Radius Guidelines

- **Buttons:** md (6px) for standard, full for pills
- **Inputs:** md (6px)
- **Cards:** lg (8px) for standard, xl (12px) for featured
- **Modals:** 2xl (16px)
- **Avatars:** full (circular)
- **Badges:** full (pill) or sm (4px)
- **Tooltips:** sm (4px)

---

## 5. Shadow System

### Shadow Scale

Inspired by Stripe and Airbnb for subtle, elegant depth.

```css
--shadow-xs:   0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm:   0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl:  0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
```

### Shadow Guidelines

- **Flat elements:** none or xs
- **Elevated cards:** sm or md
- **Dropdowns, popovers:** lg
- **Modals:** xl or 2xl
- **Pressed states:** inner
- **Hover states:** Increase one level

### Colored Shadows

For brand elements, use colored shadows for premium feel.

```css
--shadow-primary:   0 4px 14px 0 oklch(0.55 0.22 265 / 0.39);
--shadow-success:   0 4px 14px 0 oklch(0.70 0.18 145 / 0.39);
--shadow-warning:   0 4px 14px 0 oklch(0.75 0.15 85 / 0.39);
--shadow-error:     0 4px 14px 0 oklch(0.60 0.20 25 / 0.39);
```

---

## 6. Component Architecture

### Folder Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   ├── container.tsx
│   │   └── grid.tsx
│   ├── navigation/            # Navigation components
│   │   ├── navbar.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── pagination.tsx
│   │   └── tabs-nav.tsx
│   ├── forms/                 # Form components
│   │   ├── search-bar.tsx
│   │   ├── filter-panel.tsx
│   │   ├── form-field.tsx
│   │   └── form-group.tsx
│   ├── feedback/              # Feedback components
│   │   ├── loading-state.tsx
│   │   ├── error-state.tsx
│   │   ├── empty-state.tsx
│   │   ├── success-state.tsx
│   │   └── skeleton.tsx
│   ├── technician/            # Technician-specific components
│   │   ├── technician-card.tsx
│   │   ├── technician-list.tsx
│   │   ├── technician-profile.tsx
│   │   ├── technician-rating.tsx
│   │   ├── technician-badge.tsx
│   │   └── technician-availability.tsx
│   ├── service/               # Service components
│   │   ├── service-card.tsx
│   │   ├── service-category.tsx
│   │   ├── service-request.tsx
│   │   └── service-quote.tsx
│   ├── chat/                  # Chat components
│   │   ├── chat-list.tsx
│   │   ├── chat-window.tsx
│   │   ├── message-bubble.tsx
│   │   ├── chat-input.tsx
│   │   └── typing-indicator.tsx
│   ├── map/                   # Map components
│   │   ├── map-container.tsx
│   │   ├── map-marker.tsx
│   │   ├── map-popup.tsx
│   │   └── location-search.tsx
│   ├── payment/               # Payment components
│   │   ├── payment-method-card.tsx
│   │   ├── payment-form.tsx
│   │   ├── price-display.tsx
│   │   └── invoice-card.tsx
│   └── shared/                # Shared components
│       ├── button.tsx         # Custom button variants
│       ├── rating.tsx         # Star rating
│       ├── badge.tsx          # Custom badge variants
│       ├── tag.tsx            # Tag component
│       ├── divider.tsx        # Custom divider
│       └── icon-button.tsx    # Icon button wrapper
├── pages/
│   ├── public/
│   │   ├── landing.tsx        # Landing page
│   │   ├── about.tsx          # About page
│   │   └── pricing.tsx        # Pricing page
│   ├── auth/
│   │   ├── login.tsx          # Login page
│   │   ├── register.tsx       # Registration
│   │   └── forgot-password.tsx
│   ├── customer/
│   │   ├── home.tsx           # Customer home
│   │   ├── search.tsx         # Search technicians
│   │   ├── requests.tsx       # Service requests
│   │   ├── bookings.tsx      # Bookings
│   │   └── profile.tsx        # Customer profile
│   ├── technician/
│   │   ├── dashboard.tsx     # Technician dashboard
│   │   ├── schedule.tsx       # Schedule management
│   │   ├── earnings.tsx      # Earnings overview
│   │   ├── profile-edit.tsx   # Profile editing
│   │   └── requests.tsx       # Incoming requests
│   ├── chat/
│   │   ├── inbox.tsx          # Chat inbox
│   │   └── conversation.tsx   # Individual conversation
│   └── payment/
│       ├── checkout.tsx       # Checkout page
│       ├── methods.tsx        # Payment methods
│       └── history.tsx        # Payment history
├── hooks/
│   ├── use-auth.ts
│   ├── use-technicians.ts
│   ├── use-chat.ts
│   ├── use-location.ts
│   └── use-pagination.ts
├── lib/
│   ├── utils.ts
│   ├── api.ts
│   ├── constants.ts
│   └── validators.ts
├── store/
│   ├── auth-store.ts
│   ├── ui-store.ts
│   ├── chat-store.ts
│   └── location-store.ts
└── types/
    ├── technician.ts
    ├── service.ts
    ├── chat.ts
    └── payment.ts
```

---

## 7. Component Specifications

### Button Component

**Variants:**
- **primary:** Main action, INTIFIX Blue background
- **secondary:** Secondary action, neutral background
- **outline:** Bordered, transparent background
- **ghost:** No background, hover effect
- **link:** Text-only, underline on hover

**Sizes:**
- **sm:** Small buttons, compact spaces
- **md:** Standard size (default)
- **lg:** Large buttons, emphasis
- **icon:** Square, icon-only

**States:**
- Default
- Hover (slight lift, shadow increase)
- Active (pressed down)
- Disabled (reduced opacity)
- Loading (spinner)

### Card Component

**Variants:**
- **default:** Standard card with shadow
- **elevated:** Higher shadow for emphasis
- **flat:** No shadow, border only
- **interactive:** Hover effects, clickable

**Sizes:**
- **sm:** Compact cards
- **md:** Standard cards
- **lg:** Large featured cards

### Input Component

**Variants:**
- **default:** Standard input
- **filled:** Background color
- **outlined:** Border only
- **underlined:** Bottom border only

**States:**
- Default
- Focus (ring, border color change)
- Error (red border, error message)
- Disabled (reduced opacity)
- Success (green border, checkmark)

### Technician Card

**Elements:**
- Avatar (circular, 64px)
- Name (bold, lg)
- Rating (stars + number)
- Specialties (badges)
- Location (icon + text)
- Response time (badge)
- Price range (text)
- Availability indicator (dot)
- View profile button (outline)

**Layout:**
- Horizontal on desktop
- Vertical on mobile

### Service Card

**Elements:**
- Icon (large, colored)
- Title (bold)
- Description (truncated)
- Price range
- Category badge
- Request button

### Search Bar

**Elements:**
- Search input (large, rounded)
- Location input (optional)
- Category dropdown
- Search button (primary)
- Filter toggle button

**States:**
- Expanded (show filters)
- Collapsed (search only)

### Rating Component

**Variants:**
- **display:** Read-only, show rating
- **interactive:** Clickable, for reviews

**Sizes:**
- **sm:** 16px stars
- **md:** 20px stars
- **lg:** 24px stars

### Badge Component

**Variants:**
- **default:** Neutral
- **primary:** Brand color
- **success:** Green
- **warning:** Yellow
- **error:** Red
- **outline:** Bordered

### Modal/Dialog

**Elements:**
- Overlay (backdrop blur)
- Container (rounded, shadow)
- Header (title + close button)
- Body (scrollable)
- Footer (actions)

**Sizes:**
- **sm:** 400px max width
- **md:** 600px max width
- **lg:** 800px max width
- **xl:** 1000px max width
- **full:** Full screen

---

## 8. Page Wireframes

### Landing Page

#### Hero Section
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]          [Nav Links]        [Login] [Sign Up]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           Encuentra técnicos confiables                │
│              cerca de ti en minutos                     │
│                                                         │
│    La plataforma más segura para servicios técnicos    │
│                                                         │
│    [Solicitar Servicio]  [Convertirme en Técnico]     │
│                                                         │
│              [Hero Illustration/Mockup]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Statistics Section
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [5,000+]    [50,000+]    [98%]    [15 min]          │
│  Técnicos    Servicios   Satisfechos  Respuesta        │
│  Registrados  Realizados  Clientes   Promedio          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### How It Works
```
┌─────────────────────────────────────────────────────────┐
│                    Cómo Funciona                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [1]          [2]          [3]          [4]            │
│  Describe     Recibe      Elige al    Resuelve         │
│  tu problema  cotizaciones  técnico    tu problema      │
│                                                         │
│  [Icon]       [Icon]       [Icon]       [Icon]         │
│  [Text]       [Text]       [Text]       [Text]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Specialties
```
┌─────────────────────────────────────────────────────────┐
│                    Especialidades                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Computadoras]  [Laptops]  [Redes]  [Impresoras]      │
│  [Card]          [Card]     [Card]   [Card]            │
│                                                         │
│  [Software]  [Hardware]  [Seguridad]  [Soporte]        │
│  [Card]      [Card]      [Card]       [Card]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Benefits
```
┌─────────────────────────────────────────────────────────┐
│                    Beneficios                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Para Clientes]          [Para Técnicos]              │
│  • Técnicos verificados   • Ingresos flexibles         │
│  • Precios transparentes  • Horarios libres           │
│  • Pagos seguros          • Pagos garantizados         │
│  • Soporte 24/7           • Herramientas profesionales │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Testimonials
```
┌─────────────────────────────────────────────────────────┐
│                   Testimonios                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Testimonial Card]  [Testimonial Card]  [Testimonial] │
│  [Avatar + Name]     [Avatar + Name]     [Card]         │
│  [Rating + Review]    [Rating + Review]    [Avatar]      │
│                      [Name]              [Rating]       │
│                                          [Review]       │
└─────────────────────────────────────────────────────────┘
```

#### CTA Section
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           ¿Listo para resolver tu problema?           │
│                                                         │
│         Únete a miles de clientes satisfechos          │
│                                                         │
│              [Comenzar Ahora - Primary Button]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Footer
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  [Product]  [Company]  [Resources]  [Legal]    │
│          [Links]    [Links]    [Links]     [Links]     │
│          [Links]    [Links]    [Links]     [Links]     │
│                                                         │
│  [Social Icons]              [Newsletter]              │
│                                                         │
│  © 2024 INTIFIX. All rights reserved.                  │
└─────────────────────────────────────────────────────────┘
```

### Customer Home Page

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  [Search]  [Categories]  [Notif]  [Profile]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Welcome, User!]                                       │
│  ¿Qué necesitas reparar hoy?                            │
│                                                         │
│  [Large Search Bar]                                     │
│                                                         │
│  [Categories]                                          │
│  [Computadoras] [Laptops] [Redes] [Impresoras]...      │
│                                                         │
│  [Técnicos Destacados]                                  │
│  [Technician Card] [Technician Card] [Technician Card] │
│                                                         │
│  [Servicios Recientes]                                  │
│  [Service Card] [Service Card] [Service Card]           │
│                                                         │
│  [Recomendados para ti]                                 │
│  [Technician Card] [Technician Card]                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Technician Profile Page

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]              [Technician Profile]             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Avatar - Large]                                       │
│  [Name - Bold, Large]                                   │
│  [Rating - Stars + Number]                              │
│  [Specialties - Badges]                                 │
│  [Location - Icon + Text]                              │
│  [Response Time - Badge]                                │
│  [Price Range - Text]                                   │
│  [Availability - Calendar/Grid]                         │
│                                                         │
│  [About]                                                │
│  [Bio text]                                             │
│                                                         │
│  [Certifications]                                       │
│  [Certification Badge] [Certification Badge]            │
│                                                         │
│  [Services Offered]                                     │
│  [Service Card] [Service Card] [Service Card]           │
│                                                         │
│  [Reviews]                                              │
│  [Review Card]                                          │
│  [Review Card]                                          │
│                                                         │
│  [Contact Technician - Primary Button]                  │
│  [Book Service - Secondary Button]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Search/Discovery Page

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]       [Search Technicians]                   │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ [Filters]│              [Search Bar]                    │
│          │                                              │
│ Category │  [Technician Card]  [Technician Card]        │
│ ▼        │  [Technician Card]  [Technician Card]        │
│          │  [Technician Card]  [Technician Card]        │
│ Distance │  [Technician Card]  [Technician Card]        │
│ ▼        │  [Technician Card]  [Technician Card]        │
│          │                                              │
│ Rating   │              [Map View]                      │
│ ▼        │              [Toggle List/Map]               │
│          │                                              │
│ Price    │              [Pagination]                   │
│ ▼        │                                              │
│          │                                              │
│ Available│                                              │
│ □        │                                              │
│          │                                              │
│ [Apply]  │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Chat Interface

```
┌─────────────────────────────────────────────────────────┐
│  [←]  [Chat]                    [⋮]                    │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│ [Conversations│  [Technician Name]                      │
│  List]       │  [Online Status]                         │
│              │                                           │
│ [Tech 1]     │  [Today]                                 │
│ [Avatar]     │                                           │
│ [Name]       │  [Message - You]                    [✓✓] │
│ [Preview]    │                                           │
│ [Time]       │  [Message - Technician]                  │
│ [Unread]     │                                           │
│              │  [Message - You]                    [✓]  │
│ [Tech 2]     │                                           │
│ [Avatar]     │  [Typing...]                             │
│ [Name]       │                                           │
│ [Preview]    │                                           │
│ [Time]       │  [Input Field]                [Send]      │
│              │  [📎] [📷]                              │
│ [Tech 3]     │                                           │
│ [Avatar]     │                                           │
│ [Name]       │                                           │
│ [Preview]    │                                           │
│ [Time]       │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

### Payment Screens

#### Checkout Page
```
┌─────────────────────────────────────────────────────────┐
│  [← Back]              [Checkout]                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Order Summary]                                       │
│  • Service: Laptop Repair                              │
│  • Technician: John Doe                                 │
│  • Date: Tomorrow, 2:00 PM                              │
│  • Location: 123 Main St                                │
│                                                         │
│  ───────────────────────────────                        │
│  Subtotal: $50.00                                       │
│  Service Fee: $5.00                                     │
│  Total: $55.00                                          │
│                                                         │
│  [Payment Method]                                       │
│  [• Visa ****4242]  [Add New]                          │
│                                                         │
│  [Billing Address]                                      │
│  [Address fields]                                       │
│                                                         │
│  [Pay $55.00 - Primary Button]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Payment Methods Page
```
┌─────────────────────────────────────────────────────────┐
│  [← Back]         [Payment Methods]      [+ Add New]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [• Visa ****4242]  [Default]  [Edit] [Delete]         │
│  Expires 12/25                                         │
│                                                         │
│  [○ Mastercard ****1234]  [Make Default]  [Edit]      │
│  Expires 08/24                                         │
│                                                         │
│  [○ PayPal]  [Make Default]  [Edit]                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Responsive Design

### Breakpoints

```css
--breakpoint-xs:  375px;   /* Small phones */
--breakpoint-sm:  640px;   /* Large phones */
--breakpoint-md:  768px;   /* Tablets */
--breakpoint-lg:  1024px;  /* Laptops */
--breakpoint-xl:  1280px;  /* Desktops */
--breakpoint-2xl: 1536px;  /* Large screens */
```

### Mobile Strategy (375px - 640px)

**Navigation:**
- Bottom tab bar for main navigation
- Hamburger menu for secondary
- Full-screen overlays for complex menus

**Layout:**
- Single column
- Stacked cards
- Full-width inputs
- Touch-friendly targets (min 44px)

**Typography:**
- Smaller base size (14px)
- Reduced heading scale
- Simplified hierarchy

**Interactions:**
- Swipe gestures for lists
- Pull-to-refresh
- Long-press for context menus

### Tablet Strategy (768px - 1024px)

**Navigation:**
- Top navigation bar
- Collapsible sidebar
- Dropdown menus

**Layout:**
- 2-column grid
- Side-by-side cards
- Optimized for touch and mouse

**Typography:**
- Standard base size (16px)
- Full heading scale

### Desktop Strategy (1024px+)

**Navigation:**
- Full top navigation
- Persistent sidebar (optional)
- Hover menus

**Layout:**
- Multi-column grids
- Max-width containers (1280px)
- Optimized for mouse/keyboard

**Typography:**
- Larger base size (16px)
- Full heading scale
- More generous spacing

---

## 10. Animation System

### Animation Principles

1. **Purposeful:** Every animation has a clear purpose
2. **Subtle:** Never distract from content
3. **Smooth:** Use easing functions for natural motion
4. **Fast:** Keep durations short (200-400ms)
5. **Consistent:** Use the same patterns throughout

### Animation Library: Framer Motion

### Standard Animations

#### Fade In
```typescript
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
}
```

#### Slide Up
```typescript
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeOut" }
}
```

#### Scale In
```typescript
const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: "easeOut" }
}
```

#### Stagger Children
```typescript
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}
```

### Animation Use Cases

#### Page Transitions
- Fade in (200ms)
- Slide up for content (300ms)

#### Component Mounting
- Cards: Scale in (200ms)
- Lists: Staggered fade in (100ms delay between items)

#### Hover Effects
- Buttons: Scale (1.02) + Shadow increase (200ms)
- Cards: Lift (translateY -4px) + Shadow (200ms)

#### Modal Transitions
- Overlay: Fade in (200ms)
- Content: Scale in + Slide up (300ms)

#### Loading States
- Skeleton: Shimmer animation
- Spinners: Smooth rotation (1s linear)

#### Microinteractions
- Button press: Scale down (0.95) for 100ms
- Checkbox: Scale bounce
- Toggle: Smooth slide

### Animation Guidelines

- **Avoid:** Excessive motion, dizzying effects
- **Prefer:** Subtle, purposeful animations
- **Respect:** `prefers-reduced-motion` media query
- **Test:** On low-end devices for performance

---

## 11. Visual Best Practices

### Do's

1. **Use generous whitespace** - Let content breathe
2. **Maintain consistent spacing** - Follow the 8-point grid
3. **Create visual hierarchy** - Use size, weight, color
4. **Use subtle shadows** - Depth without heaviness
5. **Round corners consistently** - Follow the radius scale
6. **Choose high contrast** - Ensure accessibility (WCAG AA)
7. **Use brand color sparingly** - For emphasis only
8. **Align elements precisely** - Create visual harmony
9. **Use quality imagery** - No generic stock photos
10. **Test on all devices** - Responsive first

### Don'ts

1. **Don't use dark mode by default** - Light mode is primary
2. **Don't overuse gradients** - Subtle or none
3. **Don't use bright colors** - Keep it professional
4. **Don't crowd content** - Whitespace is your friend
5. **Don't mix too many fonts** - One font family is enough
6. **Don't use harsh shadows** - Keep them subtle
7. **Don't ignore accessibility** - Color contrast matters
8. **Don't use generic stock photos** - Invest in custom visuals
9. **Don't over-animate** - Keep it subtle
10. **Don't break the grid** - Consistency builds trust

---

## 12. Image & Illustration Guidelines

### Photography Style

**Approach:**
- Authentic, diverse people
- Real work environments
- Natural lighting
- Professional yet approachable
- Diverse representation (age, gender, ethnicity)

**Recommended Sources:**
- Unsplash (curated collections)
- Pexels (free, high quality)
- Stock photos from authentic tech companies
- Custom photography (budget permitting)

### Illustration Style

**Approach:**
- Minimalist line art
- Soft color palette
- Abstract representations
- Not cartoonish
- Professional and modern

**Recommended Styles:**
- Linear-style illustrations
- Abstract geometric shapes
- Isometric views (sparingly)
- Custom SVG icons

### Icon Style

**Library:** Lucide React (already installed)

**Usage:**
- Consistent stroke width (2px)
- Rounded caps and joins
- Neutral colors by default
- Brand color for emphasis
- 16px, 20px, 24px sizes

---

## 13. Accessibility Guidelines

### Color Contrast

- **Normal text:** 4.5:1 minimum (WCAG AA)
- **Large text:** 3:1 minimum (WCAG AA)
- **UI components:** 3:1 minimum
- **Focus indicators:** 3:1 minimum

### Keyboard Navigation

- All interactive elements keyboard accessible
- Visible focus indicators (ring)
- Logical tab order
- Skip to main content link
- Escape closes modals/dropdowns

### Screen Readers

- Semantic HTML elements
- ARIA labels where needed
- Alt text for images
- Descriptive link text
- Form labels associated with inputs

### Motion Preferences

- Respect `prefers-reduced-motion`
- Provide alternatives for animations
- No auto-playing videos with sound

---

## 14. Performance Guidelines

### Image Optimization

- WebP format preferred
- Lazy loading below fold
- Responsive images (srcset)
- Compression at 85% quality
- Max width 2000px

### Code Splitting

- Route-based splitting
- Lazy load components
- Dynamic imports for heavy libraries
- Tree shaking enabled

### CSS Optimization

- Purge unused Tailwind classes
- Critical CSS inline
- Minify production builds
- Avoid inline styles

### Font Loading

- Font-display: swap
- Subset font files
- Preload critical fonts
- Use variable fonts (already doing)

---

## 15. Implementation Priority

### Phase 1: Foundation (Week 1)
1. Update color system in index.css
2. Configure typography system
3. Set up spacing, shadows, radius tokens
4. Create base layout components
5. Implement responsive breakpoints

### Phase 2: Core Components (Week 2)
1. Button component (all variants)
2. Input component (all variants)
3. Card component (all variants)
4. Badge component
5. Rating component
6. Avatar component

### Phase 3: Landing Page (Week 3)
1. Hero section
2. Statistics section
3. How it works
4. Specialties
5. Benefits
6. Testimonials
7. CTA section
8. Footer

### Phase 4: Customer Experience (Week 4)
1. Customer home page
2. Search/Discovery page
3. Technician profile page
4. Service request flow
5. Booking flow

### Phase 5: Technician Experience (Week 5)
1. Technician dashboard
2. Profile editing
3. Schedule management
4. Earnings overview
5. Request management

### Phase 6: Communication (Week 6)
1. Chat interface
2. Notification system
3. Message templates
4. File sharing

### Phase 7: Payments (Week 7)
1. Payment methods
2. Checkout flow
3. Invoice generation
4. Payment history

### Phase 8: Polish (Week 8)
1. Animations with Framer Motion
2. Microinteractions
3. Loading states
4. Error states
5. Empty states
6. Accessibility audit
7. Performance optimization

---

## 16. Design Tokens Summary

### Color Tokens
```css
/* Primary */
--color-primary: oklch(0.55 0.22 265);
--color-primary-foreground: oklch(1 0 0);

/* Secondary */
--color-secondary: oklch(0.65 0.15 195);
--color-secondary-foreground: oklch(1 0 0);

/* Accent */
--color-accent: oklch(0.68 0.18 25);

/* Semantic */
--color-success: oklch(0.70 0.18 145);
--color-warning: oklch(0.75 0.15 85);
--color-error: oklch(0.60 0.20 25);

/* Neutral Scale */
--color-neutral-50: oklch(0.98 0.005 265);
--color-neutral-100: oklch(0.96 0.005 265);
--color-neutral-200: oklch(0.94 0.005 265);
--color-neutral-300: oklch(0.90 0.005 265);
--color-neutral-400: oklch(0.82 0.005 265);
--color-neutral-500: oklch(0.65 0.005 265);
--color-neutral-600: oklch(0.45 0.005 265);
--color-neutral-700: oklch(0.35 0.005 265);
--color-neutral-800: oklch(0.25 0.005 265);
--color-neutral-900: oklch(0.15 0.005 265);
--color-neutral-950: oklch(0.09 0.005 265);
```

### Typography Tokens
```css
--font-family: 'Geist Variable', sans-serif;
--font-xs: 0.75rem;
--font-sm: 0.875rem;
--font-base: 1rem;
--font-lg: 1.125rem;
--font-xl: 1.25rem;
--font-2xl: 1.5rem;
--font-3xl: 1.875rem;
--font-4xl: 2.25rem;
--font-5xl: 3rem;
--font-6xl: 3.75rem;
```

### Spacing Tokens
```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
--space-24: 6rem;
--space-32: 8rem;
```

### Radius Tokens
```css
--radius-sm: 0.25rem;
--radius-md: 0.375rem;
--radius-lg: 0.5rem;
--radius-xl: 0.75rem;
--radius-2xl: 1rem;
--radius-full: 9999px;
```

### Shadow Tokens
```css
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## 17. Next Steps

1. **Review and approve** this design system
2. **Install Framer Motion** for animations
3. **Update index.css** with new color system
4. **Create base components** following specifications
5. **Build Landing Page** as first implementation
6. **Test responsive behavior** across devices
7. **Conduct accessibility audit**
8. **Iterate based on feedback**

---

## 18. Design System Maintenance

### Version Control
- Document all changes
- Use semantic versioning
- Maintain changelog
- Communicate updates to team

### Regular Reviews
- Quarterly design system reviews
- Gather feedback from users
- Update based on new requirements
- Remove unused components

### Documentation
- Keep this document updated
- Add component examples
- Create storybook for components
- Maintain usage guidelines

---

This design system provides a complete foundation for building a premium, trustworthy, and modern INTIFIX platform that rivals Airbnb, Uber, and other top-tier startups. The system is flexible, scalable, and designed for long-term growth.
