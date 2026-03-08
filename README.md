# Fleet Buddy Landing Page

A modern, responsive SaaS landing page for Fleet Buddy - a comprehensive fleet management platform available on Web, Android, and iOS.

## Features

- 🎨 Modern, clean design with Tailwind CSS
- 📱 Fully responsive and mobile-first
- 🚀 Built with Next.js 14
- ✨ Smooth scrolling navigation
- 🎯 All sections as specified in requirements

## Getting Started

### Quick Start (Development)

1. Navigate to the project directory:
```bash
cd BUS_BUDDY_LANDING
```

2. Install dependencies (only needed the first time or after pulling updates):
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** The server will automatically reload when you make changes to your code.

### Running in the Future

Simply run these commands from the `BUS_BUDDY_LANDING` directory:
```bash
cd BUS_BUDDY_LANDING
npm run dev
```

Then open **http://localhost:3000** in your browser.

## Project Structure

```
BUS_BUDDY_LANDING/
├── app/
│   ├── globals.css      # Global styles with Tailwind
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main landing page component
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Sections

1. **Hero Section** - Main headline with CTAs and live OpenStreetMap of Ahmedabad
2. **Who it's for** - Target audience grid (generic fleet management)
3. **Features** - 6 feature cards in a responsive grid
4. **How it works** - 3-step process
5. **Why Fleet Buddy** - Differentiators vs generic FMS
6. **Pricing** - Custom pricing section
7. **Social Proof** - Metrics and testimonials
8. **Live View** - Live map tracking and MDVR video section
9. **Contact Form** - Demo booking form
10. **Footer** - Contact information and platform details

## Features

- **OpenStreetMap Integration** - Live map showing Ahmedabad, Gujarat with vehicle markers
- **Multi-Platform Support** - Web, Android, and iOS badges
- **Contact Information** - Email and address in footer
- **Live View Section** - Showcasing real-time tracking and video feeds

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Heroicons
- Leaflet & React-Leaflet (for OpenStreetMap integration)

## Build for Production

```bash
npm run build
npm start
```

