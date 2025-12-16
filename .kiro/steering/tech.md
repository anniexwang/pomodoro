# Technology Stack

## Core Framework
- **React Native**: 0.81.5 with React 19.1.0
- **Expo**: ~54.0.27 with Expo Router ~6.0.17 for file-based routing
- **TypeScript**: ~5.9.2 with strict mode enabled

## Key Libraries
- **Navigation**: @react-navigation/native with bottom tabs
- **Animations**: react-native-reanimated ~4.1.1
- **Gestures**: react-native-gesture-handler ~2.28.0
- **Icons**: @expo/vector-icons and expo-symbols
- **Theming**: Built-in theme system with automatic dark/light mode

## Development Tools
- **ESLint**: expo lint configuration
- **TypeScript**: Strict mode with path aliases (@/*)
- **Expo CLI**: For development and building

## Common Commands

### Development
```bash
npm start          # Start Expo development server
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web development server
```

### Code Quality
```bash
npm run lint       # Run ESLint checks
```

### Project Management
```bash
npm run reset-project  # Reset project to clean state
```

## Build Configuration
- **New Architecture**: Enabled for performance improvements
- **Typed Routes**: Experimental feature for type-safe navigation
- **React Compiler**: Experimental optimization feature
- **Path Aliases**: `@/*` maps to project root for clean imports