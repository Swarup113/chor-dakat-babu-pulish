# Chor-Dakat-Babu-Pulish

A multiplayer party game where players take on different roles and try to deduce who the culprit is. Perfect for 4+ players!

## Features

- Multiplayer gameplay (4 players)
- Multiple game modes (Chor and Dakat rounds)
- Real-time scoring system
- Achievement badges
- Responsive design (works on desktop and mobile)
- Android APK support

## Getting Started

### Web Browser

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

### Android Phone

Build and run as native Android app:

```bash
npm run build:android
npm run android
```

For detailed Android build instructions, see [ANDROID_APK_BUILD.md](./ANDROID_APK_BUILD.md)

## Game Rules

### Players & Roles
- **Pulish (Police)**: Tries to identify the culprit
- **Babu (Aristocrat)**: Earns points automatically, can't be suspected
- **Chor (Thief)**: One round type - must avoid Pulish's guess
- **Dakat (Robber)**: Other round type - must avoid Pulish's guess

### How to Play
1. Enter player names
2. Each player views their secret role privately
3. Pulish has 30 seconds to guess the culprit
4. Roles are revealed and points are distributed
5. Continue for multiple rounds
6. View final scores and achievements

### Scoring
- **Pulish correct guess**: 100 points
- **Pulish wrong guess**: 0 points
- **Babu**: Always 100 points per round
- **Chor/Dakat if not caught**: 50 points
- **Chor/Dakat if caught**: 0 points

## UI Layout

### Desktop
- Scoreboard table in the center
- Player cards in all 4 corners with live scores
- Beautiful gradient design with smooth animations

### Mobile
- Full-width scoreboard
- Player cards displayed in 2x2 grid above scoreboard
- Tappable badge icons to see achievement details
- Touch-optimized interface

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (web)
- `npm run build:android` - Build web + sync for Android
- `npm run android` - Open Android project in Android Studio
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checker

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Capacitor (for Android)
- Lucide React (icons)
- Supabase (optional for data persistence)

## Project Structure

```
src/
├── components/
│   └── GameBoard.tsx      # Main game component
├── types/
│   └── game.ts           # Game type definitions
├── utils/
│   └── gameLogic.ts      # Game logic and calculations
├── App.tsx               # Root component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
