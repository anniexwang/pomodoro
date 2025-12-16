# Project Structure

## File-Based Routing (app/ directory)
- **app/_layout.tsx**: Root layout with theme provider and navigation stack
- **app/(tabs)/**: Tab-based screens using Expo Router groups
  - `_layout.tsx`: Tab navigation configuration
  - `index.tsx`: Home screen (default tab)
  - `explore.tsx`: Explore screen
- **app/modal.tsx**: Modal screens

## Component Organization
- **components/**: Reusable UI components
  - `themed-*.tsx`: Theme-aware components (ThemedText, ThemedView)
  - `ui/`: Low-level UI primitives (IconSymbol, Collapsible)
  - Platform-specific files use `.ios.tsx` or `.web.tsx` extensions
- **hooks/**: Custom React hooks
  - Theme-related hooks (useColorScheme, useThemeColor)
  - Platform-specific hooks use `.web.ts` extension
- **constants/**: App-wide constants
  - `theme.ts`: Color schemes and font definitions

## Assets
- **assets/images/**: All image assets
  - App icons for different platforms
  - Splash screen assets
  - React logo variants

## Configuration Files
- **app.json**: Expo configuration
- **tsconfig.json**: TypeScript configuration with path aliases
- **package.json**: Dependencies and scripts
- **eslint.config.js**: Linting rules

## Naming Conventions
- Use kebab-case for file names
- Use PascalCase for component names
- Use camelCase for hooks and utilities
- Platform-specific files: `filename.platform.extension`
- Group routes use parentheses: `(tabs)`

## Import Patterns
- Use `@/` alias for imports from project root
- Prefer named exports over default exports for utilities
- Use default exports for React components and screens