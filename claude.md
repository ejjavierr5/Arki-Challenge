# Arki-Challenge

Architecture practice and challenge platform for architecture students and professionals in the Philippines.

## Project Overview

Arki-Challenge is a web application that provides structured architecture design challenges with detailed project briefs, room programs, site specifications, and design requirements. Users can practice their architectural design skills through:

- **40+ Architecture Projects**: Ranging from residential micro-homes to master-level mixed-use towers
- **Daily Design Challenges**: Quick exercises with specific constraints and deliverables
- **Daily Designs**: Curated architectural inspirations from iconic buildings worldwide
- **Google Drive Integration**: Save and manage project files via Google OAuth

### Target Users

- Architecture students preparing for board exams or building portfolios
- Architecture professionals practicing design skills
- Design enthusiasts exploring architectural concepts

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.9.x | Type safety |
| Vite | 8.x | Build tool and dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| Framer Motion | 12.x | Animations and transitions |
| Lucide React | 0.577.x | Icon library |
| clsx + tailwind-merge | Latest | Class name utilities |

## Project Structure

```
Arki-Challenge/
├── src/
│   ├── App.tsx                 # Root component (renders ProjectDashboard)
│   ├── main.tsx                # Entry point, React root, Google API types
│   ├── ProjectDashboard.tsx    # Main dashboard component (~1800+ lines)
│   ├── data.ts                 # Project data, types, and challenge definitions
│   ├── index.css               # Tailwind imports + custom theme
│   └── assets/                 # Static assets (SVGs, images)
│       ├── hero.png
│       ├── react.svg
│       └── vite.svg
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript base config
├── tsconfig.app.json           # App-specific TypeScript config
├── tsconfig.node.json          # Node-specific TypeScript config
├── eslint.config.js            # ESLint flat config
├── package.json                # Dependencies and scripts
└── .env                        # Environment variables (not committed)
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Architecture & Patterns

### Component Structure

The application follows a **single-file component approach** where `ProjectDashboard.tsx` contains the main application logic. This is a large, feature-rich component that manages:

- Project listing and filtering
- Daily challenges display
- Daily designs carousel
- Google Drive authentication
- Modal dialogs and overlays

### Utility Pattern

The `cn()` utility function combines `clsx` and `tailwind-merge` for conditional class names:

```tsx
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  anotherCondition ? "true-classes" : "false-classes"
)} />
```

### State Management

- **Local state with `useState`**: All state is component-local
- **No global state library**: Application is self-contained
- **Memoization**: Uses `useMemo` and `useCallback` for performance

### TypeScript Strict Mode

The project enforces strict TypeScript settings:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

## Key Components

### ProjectDashboard (`src/ProjectDashboard.tsx`)

The main application component containing:

- **DifficultyBadge**: Displays project difficulty with star ratings
- **SoftwareBadge**: Shows required software tools
- **DAILY_DESIGNS**: Array of 30 iconic architectural designs
- **DAILY_CHALLENGES**: Array of 30 architecture exercises

### App (`src/App.tsx`)

Minimal root component that renders `ProjectDashboard`:

```tsx
import ProjectDashboard from './ProjectDashboard'

export default function App() {
  return <ProjectDashboard />
}
```

## Data Models

### Core Types (`src/data.ts`)

```typescript
// Difficulty levels for projects
type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Master';

// Room specification in a project
type RoomProgram = {
  room: string;
  quantity: number;
  minArea: string;
  notes?: string;
};

// Complete project definition
type Project = {
  id: string;
  title: string;
  plateNumber: string;
  difficulty: DifficultyLevel;
  category: string;                    // 'residential' | 'commercial' | 'institutional' | 'infrastructure' | 'high-rise'
  niche: string;
  image: string;
  durationDays: number;
  software: string[];
  requiredFiles: string[];
  client: {
    name: string;
    message: string;
  };
  designSpecs: {
    architecturalStyle: string;
    colorPalette: { hex: string; name: string }[];
    technicalNeeds: string[];
  };
  siteTechnicalSpecs: {
    bearings: string[];
    area: string;
    location: string;
  };
  roomProgram: RoomProgram[];
  inspirations: { name: string; architect: string; why: string }[];
  points: number;
};
```

### Daily Challenge Type (`src/ProjectDashboard.tsx`)

```typescript
type DailyChallenge = {
  title: string;
  category: string;
  difficulty: string;
  duration: string;
  prompt: string;
  constraints: string[];
  deliverable: string;
  tip: string;
  color: string;
  architecturalStyle: string;
  colorPalette: { hex: string; name: string }[];
  bearings: string[];
  siteArea: string;
  siteLocation: string;
  inspirations: { name: string; architect: string; why: string }[];
};
```

## Styling Conventions

### Custom Tailwind Theme (`src/index.css`)

```css
@theme {
  --color-architectural-dark: #0f1115;
  --color-architectural-slate: #1e2329;
  --color-architectural-blue: #2c4b7c;
  --color-architectural-yellow: #f4b400;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}
```

### Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `architectural-dark` | `#0f1115` | Primary background |
| `architectural-slate` | `#1e2329` | Card backgrounds |
| `architectural-blue` | `#2c4b7c` | Accent elements |
| `architectural-yellow` | `#f4b400` | Highlights, CTAs |

### Difficulty Badge Colors

```typescript
const config = {
  Easy: { color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5', stars: 1 },
  Medium: { color: 'text-blue-400 border-blue-400/20 bg-blue-400/5', stars: 2 },
  Hard: { color: 'text-orange-400 border-orange-400/20 bg-orange-400/5', stars: 3 },
  Master: { color: 'text-red-500 border-red-500/20 bg-red-500/5', stars: 4 }
};
```

### Custom Scrollbar

Thin, subtle scrollbars with hover states:

```css
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
}
```

### Architectural Grid Background

```css
.architectural-grid {
  background-size: 40px 40px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
}
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Google OAuth Client ID for Drive integration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Accessing Environment Variables

```typescript
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
```

## Code Conventions

### Naming

- **Components**: PascalCase (`ProjectDashboard`, `DifficultyBadge`)
- **Functions**: camelCase (`cn`, `handleClick`)
- **Types**: PascalCase (`Project`, `DifficultyLevel`, `RoomProgram`)
- **Constants**: SCREAMING_SNAKE_CASE (`DAILY_DESIGNS`, `DAILY_CHALLENGES`)
- **Files**: PascalCase for components (`ProjectDashboard.tsx`), camelCase for utilities (`data.ts`)

### Exports

- **Types**: Named exports (`export type Project = ...`)
- **Data**: Named exports (`export const projects: Project[] = ...`)
- **Components**: Default exports (`export default function App()`)

### Imports Order

1. React imports
2. Third-party libraries
3. Local components
4. Types
5. Styles/assets

```tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { projects } from './data';
import type { Project, DifficultyLevel, RoomProgram } from './data';
```

### Component Patterns

```tsx
// Inline sub-components for small, local pieces
const DifficultyBadge = ({ level }: { level: DifficultyLevel }) => {
  // ...
};

// Props destructuring
const SoftwareBadge = ({ s }: { s: string }) => (
  // ...
);
```

## Project Categories

Projects are organized into these categories:

| Category | Examples |
|----------|----------|
| `residential` | Single-family homes, apartments, micro-homes |
| `commercial` | Office towers, retail, restaurants, resorts |
| `institutional` | Schools, museums, health centers, fire stations |
| `infrastructure` | Ports, logistics terminals |
| `high-rise` | Mixed-use towers, super high-rise buildings |

## Points System

Projects award points based on complexity:

| Difficulty | Typical Points | Duration |
|------------|---------------|----------|
| Easy | 75-150 | 5-7 days |
| Medium | 300-450 | 14 days |
| Hard | 600-700 | 21 days |
| Master | 900-950 | 30 days |

## Google API Integration

The application integrates with Google APIs for Drive file management:

```typescript
// Global type declarations (src/main.tsx)
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// OAuth scopes used
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly';
```

## Common Tasks

### Adding a New Project

1. Open `src/data.ts`
2. Add a new object to the `projects` array following the `Project` type
3. Assign a unique `id` and sequential `plateNumber`

### Adding a New Daily Challenge

1. Open `src/ProjectDashboard.tsx`
2. Add a new object to the `DAILY_CHALLENGES` array following the `DailyChallenge` type

### Modifying Theme Colors

1. Edit `src/index.css`
2. Update values in the `@theme` block
3. Reference using Tailwind classes: `bg-architectural-dark`, `text-architectural-yellow`

### Adding New Icons

Icons come from Lucide React. Import the full library:

```tsx
import * as Icons from 'lucide-react';

// Usage
<Icons.Star size={6} fill="currentColor" />
<Icons.ChevronRight size={16} />
```
