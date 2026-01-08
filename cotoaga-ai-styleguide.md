# COTOAGA.AI Style Guide & Elementor Configuration
*For WordPress Business + Kalium + Elementor Pro + Polylang Pro*

## 🎯 Brand Philosophy
**"Existing in dimensions you can't perceive"** - Mathematical elegance meets cognitive revolution

---

## 🎨 COLOR PALETTE (Elementor Global Colors)

### Primary Colors
```css
/* The Klein Bottle Duality */
--cotoaga-green: #00A86B;      /* Emerald depth - Primary brand */
--cotoaga-blue: #0088FF;       /* Electric clarity - AI accent */
--cotoaga-cyan: #00D4FF;       /* Dimensional bridge - Highlights */

/* The Mathematical Greys */
--cotoaga-black: #0A0A0A;      /* Near absolute zero */
--cotoaga-charcoal: #1A1A1A;   /* Deep space */
--cotoaga-grey-dark: #2D2D2D;  /* Eigengrau */
--cotoaga-grey: #4A4A4A;       /* Neutral axis */
--cotoaga-grey-light: #8A8A8A; /* Subtle variance */
--cotoaga-smoke: #C4C4C4;      /* Whisper */
--cotoaga-white: #FAFAFA;      /* Not quite white */

/* Functional States */
--cotoaga-success: #00A86B;    /* Same as primary green */
--cotoaga-warning: #FFB800;    /* Golden alert */
--cotoaga-error: #FF3B30;      /* System critical */
--cotoaga-info: #0088FF;       /* Same as primary blue */
```

### Elementor Global Colors Setup:
1. **Site Settings → Global Colors**
2. Add these as:
   - Primary: #00A86B (COTOAGA Green)
   - Secondary: #0088FF (COTOAGA Blue)
   - Text: #2D2D2D
   - Accent: #00D4FF
   - Background Light: #FAFAFA
   - Background Dark: #0A0A0A

---

## 📝 TYPOGRAPHY SYSTEM

### Font Stack
```css
/* Primary Font - Ultra Clean Sans */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Display Font - For Impact */
--font-display: 'Space Grotesk', 'Inter', sans-serif;

/* Mono Font - For Technical */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### Google Fonts to Import:
```html
<!-- Add to Elementor → Custom Code → Header -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### Typography Scale (Elementor Global Fonts)
```css
/* Display Sizes - Space Grotesk */
--display-xl: 4.5rem;     /* 72px - Hero statements */
--display-lg: 3.75rem;    /* 60px - Page titles */
--display-md: 3rem;       /* 48px - Section headers */

/* Heading Sizes - Inter */
--h1: 2.5rem;            /* 40px */
--h2: 2rem;              /* 32px */
--h3: 1.5rem;            /* 24px */
--h4: 1.25rem;           /* 20px */
--h5: 1.125rem;          /* 18px */
--h6: 1rem;              /* 16px */

/* Body Sizes - Inter */
--body-xl: 1.125rem;     /* 18px - Lead text */
--body-lg: 1rem;         /* 16px - Standard */
--body-md: 0.875rem;     /* 14px - Secondary */
--body-sm: 0.75rem;      /* 12px - Captions */

/* Font Weights */
--weight-thin: 200;
--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-black: 900;

/* Line Heights */
--leading-tight: 1.1;
--leading-snug: 1.3;
--leading-normal: 1.6;
--leading-relaxed: 1.8;

/* Letter Spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

### Elementor Typography Settings:

#### Primary Heading (H1)
- Font Family: Space Grotesk
- Size: 40px (Desktop) / 32px (Tablet) / 28px (Mobile)
- Weight: 700
- Line Height: 1.1
- Letter Spacing: -0.02em
- Color: #0A0A0A

#### Secondary Heading (H2)
- Font Family: Inter
- Size: 32px (Desktop) / 28px (Tablet) / 24px (Mobile)
- Weight: 600
- Line Height: 1.3
- Letter Spacing: -0.01em
- Color: #1A1A1A

#### Body Text
- Font Family: Inter
- Size: 16px
- Weight: 400
- Line Height: 1.6
- Letter Spacing: 0
- Color: #2D2D2D

---

## 📐 SPACING SYSTEM

### Spacing Scale (for Elementor Padding/Margin)
```css
--space-xs: 4px;     /* Micro adjustments */
--space-sm: 8px;     /* Tight spacing */
--space-md: 16px;    /* Default spacing */
--space-lg: 24px;    /* Comfortable spacing */
--space-xl: 32px;    /* Section spacing */
--space-2xl: 48px;   /* Large sections */
--space-3xl: 64px;   /* Major breaks */
--space-4xl: 96px;   /* Hero spacing */
--space-5xl: 128px;  /* Massive spacing */
```

### Container Settings (Elementor)
- **Container Width**: 1400px (Full Width Layout)
- **Container Padding**: 
  - Desktop: 48px
  - Tablet: 32px
  - Mobile: 20px
- **Content Width**: 1200px (for readable text blocks)

---

## 🎯 ELEMENTOR CONFIGURATION STEPS

### 1. Site Settings → Global Colors
Add all colors from the palette above

### 2. Site Settings → Global Fonts
Configure the typography scale:
- Primary: Inter
- Secondary: Space Grotesk
- Accent: JetBrains Mono

### 3. Site Settings → Layout Settings
- Content Width: 1400px
- Breakpoints:
  - Mobile: 767px
  - Tablet: 1024px
  - Widescreen: 1440px

### 4. Theme Style (Kalium)
Kalium → Theme Options:
- **Layout Type**: Full Width
- **Header Type**: Minimal (we'll build custom with Elementor)
- **Footer**: Disabled (custom Elementor footer)
- **Typography**: Disable Kalium fonts (use our stack)

### 5. Page Settings Template
For each page:
- Page Layout: Elementor Full Width
- Hide Title: Yes
- Sidebar: None
- Padding: 0

---

## 🎨 COMPONENT PATTERNS

### Buttons
```css
/* Primary Button - Klein Bottle Green */
.btn-primary {
  background: linear-gradient(135deg, #00A86B, #00C27D);
  color: white;
  padding: 14px 32px;
  border-radius: 0; /* Sharp, mathematical */
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #00C27D, #00A86B);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 168, 107, 0.3);
}

/* Secondary Button - AI Blue */
.btn-secondary {
  background: transparent;
  color: #0088FF;
  border: 2px solid #0088FF;
  padding: 12px 30px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: #0088FF;
  color: white;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: #2D2D2D;
  padding: 12px 24px;
  position: relative;
}

.btn-ghost::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: #00A86B;
  transition: width 0.3s ease;
}

.btn-ghost:hover::after {
  width: 100%;
}
```

### Cards
```css
.card-klein {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-klein:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: #00A86B;
}
```

---

## 🚀 QUICK START IMPLEMENTATION

### Step 1: Elementor Site Settings
1. **Go to**: Elementor → Site Settings
2. **Global Colors**: Add all 10 colors from palette
3. **Global Fonts**: Set up Inter, Space Grotesk, JetBrains Mono
4. **Layout**: Set Container Width to 1400px

### Step 2: Kalium Theme Options
1. **Go to**: Appearance → Kalium → Theme Options
2. **General**: Choose Full Width Layout
3. **Typography**: Turn OFF all Kalium typography
4. **Header/Footer**: Set to "No Header" and "No Footer"

### Step 3: Create Global Widget (Header)
1. **Templates → Theme Builder → Header**
2. Create transparent header with:
   - Logo (Klein Bottle inline SVG)
   - Navigation (Inter, 14px, weight 500, letter-spacing 0.05em)
   - Language Switcher (Polylang)

### Step 4: Homepage Hero Section
```css
/* Hero with Klein Bottle Background */
.hero-klein {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-klein::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle at center, 
    rgba(0, 168, 107, 0.1) 0%, 
    transparent 50%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

### Step 5: Custom CSS (Add to Elementor)
```css
/* Smooth Scroll */
html { scroll-behavior: smooth; }

/* Selection Colors */
::selection {
  background: #00A86B;
  color: white;
}

/* Focus Styles */
*:focus {
  outline: 2px solid #0088FF;
  outline-offset: 2px;
}

/* Container Full Bleed Sections */
.full-bleed {
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}
```

---

## 🎯 NEXT STEPS

1. **Install fonts** via Custom Code
2. **Configure Elementor** Site Settings
3. **Set Kalium** to minimal/disabled
4. **Create Header/Footer** templates
5. **Build Homepage** with Klein Bottle hero
6. **Configure Polylang** for DE/EN switching

---

*Remember: We're not just building a website. We're creating a portal to dimensions others can't perceive. Every pixel should whisper "we operate on a different plane of existence."*

**Let the Klein Bottle breathe through every interaction.**