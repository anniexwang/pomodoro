# Pomodoro Timer App 🍅

A beautiful, customizable Pomodoro timer built with React Native and Expo. Features background persistence, customizable themes, and a clean, intuitive interface to help you stay focused and productive.

## Features

### 🎯 Core Timer Functionality
- **Automatic Cycling**: Seamlessly transitions between study sessions (default 25 min) and breaks (default 5 min)
- **Background Persistence**: Timer continues running when you navigate away or minimize the app
- **Flexible Controls**: Start, pause, resume, and reset functionality
- **Custom Durations**: Adjust study and break periods to match your productivity style (1-60 min study, 1-30 min breaks)
- **Progress Tracking**: Visual circular progress indicator and completed Pomodoro counter

### 🎨 Theming & Personalization
- **Predefined Themes**: Choose from curated themes including Default, Snow, Christmas, and Pokemon
- **Dynamic Backgrounds**: Animated background elements that change based on your current phase (study/break)
- **Theme Persistence**: Your selected themes are saved across app sessions
- **Accessibility**: All themes maintain proper contrast ratios for readability

### 📱 Cross-Platform Support
- **iOS**: Native iOS experience with tablet support
- **Android**: Adaptive icons and edge-to-edge display
- **Web**: Progressive web app with static output

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open the app on your preferred platform:
   - **iOS Simulator**: Press `i` in the terminal or run `npm run ios`
   - **Android Emulator**: Press `a` in the terminal or run `npm run android`
   - **Web Browser**: Press `w` in the terminal or run `npm run web`
   - **Physical Device**: Scan the QR code with Expo Go app

## Available Scripts

```bash
npm start          # Start Expo development server
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web development server
npm run lint       # Run ESLint checks
npm test           # Run Jest tests
npm run reset-project  # Reset to clean project state
```

## Technology Stack

- **Framework**: React Native 0.81.5 with React 19.1.0
- **Platform**: Expo ~54.0.27 with Expo Router ~6.0.17
- **Language**: TypeScript ~5.9.2 with strict mode
- **Navigation**: File-based routing with Expo Router
- **Animations**: React Native Reanimated ~4.1.1
- **Storage**: AsyncStorage for settings and theme persistence
- **Testing**: Jest with TypeScript support

## Project Structure

```
├── app/                    # File-based routing screens
├── components/            # Reusable UI components
│   ├── ui/               # Low-level UI primitives
│   └── __tests__/        # Component tests
├── hooks/                # Custom React hooks
├── services/             # Business logic and API services
│   └── __tests__/        # Service tests
├── types/                # TypeScript type definitions
├── constants/            # App-wide constants and themes
└── assets/               # Images, icons, and static assets
```

## Key Components

- **Timer Screen**: Main Pomodoro timer interface with controls
- **Theme Picker**: Modal for selecting predefined themes
- **Duration Settings**: Configurable study and break period durations
- **Background Elements**: Animated visual elements that respond to timer state
- **Circular Progress**: Custom progress ring component



## Development

### Running Tests
```bash
npm test                    # Run all tests
npm test -- --watch       # Run tests in watch mode
npm test -- --coverage    # Run tests with coverage report
```

### Code Quality
```bash
npm run lint               # Check for linting errors
npm run lint -- --fix     # Auto-fix linting issues
```

### Building for Production
```bash
npx expo build:ios        # Build for iOS App Store
npx expo build:android    # Build for Google Play Store
npx expo export            # Export for web deployment
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- Inspired by the [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) by Francesco Cirillo
