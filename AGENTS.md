# AGENTS.md

This file contains guidelines and commands for agentic coding agents working on this Mendix Pluggable Widget repository.

## Project Overview

**Project Type**: Mendix Pluggable Widget (Dynamic Navigation Component)
- **Widget Name**: DynamicNavigation
- **Primary Technology**: React 18.2.0 with TypeScript
- **Framework**: Mendix Pluggable Widgets Tools v10.15.0
- **Target Platform**: Mendix Low-Code Platform
- **Purpose**: Role-based navigation widget with bookmark management, drag-and-drop reorganization, and multi-layout support

**Key Features**:
- Dynamic menu generation from database entities
- Role-based access control implementation
- Bookmark management with tree structure
- Drag-and-drop reorganization using react-beautiful-dnd
- Multi-layout support (vertical/horizontal/topbar_fullwidth)
- Collapsible navigation states with localStorage persistence
- Multi-language support (Korean/English)

## Build Commands

### Development
```bash
npm start          # Start Mendix development server
npm dev            # Start web development server with hot reload
```

### Build & Release
```bash
npm build          # Build for production
npm prerelease     # Run linting before release
npm release        # Build and package widget
```

### Testing
```bash
npm test           # Run all tests (unit + e2e)
npm run test:unit  # Run unit tests with coverage
npm run test:e2e   # Open Cypress E2E test runner
```

### Code Quality
```bash
npm run lint       # Check code quality
npm run lint:fix   # Auto-fix linting issues
```

**Running Single Tests**: This project uses pluggable-widgets-tools test runner. For specific test files, use:
```bash
npx pluggable-widgets-tools test:unit:web --testNamePattern="YourTestName"
```

## Code Style Guidelines

### File Structure & Naming
```
src/
├── components/          # React components (PascalCase)
├── hooks/              # Custom React hooks (use* prefix)
├── types/              # TypeScript type definitions (*.types.ts)
├── ui/                 # SCSS stylesheets (kebab-case.scss)
├── utils/              # Utility functions (camelCase.ts)
└── assets/             # Static assets
```

**Naming Conventions**:
- **Components**: PascalCase (e.g., `DynamicNavigation`, `NavigationMenu`)
- **Functions**: camelCase with descriptive names (e.g., `useMenuData`, `buildMenuTree`)
- **Types**: PascalCase interfaces (e.g., `DynamicNavigationContainerProps`)
- **SCSS classes**: kebab-case with BEM-like patterns (e.g., `.nav-sidebar`)
- **Constants**: UPPER_SNAKE_CASE for exports

### Import Organization
```typescript
// 1. React imports
import { ReactElement, createElement, useState, useEffect } from "react";

// 2. Third-party libraries
import classNames from "classnames";
import { TreeItemIndex } from "react-complex-tree";

// 3. Internal imports (relative)
import { MenuTreeNode } from "../types/menu.types";
import { NavigationMenu } from "./components/NavigationMenu";
import { useMenuData } from "./hooks/useMenuData";

// 4. Styles
import "./ui/DynamicNavigation.scss";
```

### TypeScript Guidelines
- Use TypeScript interfaces for all props and data structures
- Export types from `types/*.types.ts` files
- Use generic types appropriately (e.g., `ReactElement`, `TreeItemIndex`)
- Avoid `any` type - prefer `unknown` or proper interfaces
- Use union types for string literals (e.g., `"vertical" | "horizontal"`)

### React Patterns
- Use functional components with hooks
- Custom hooks for state management and side effects
- Memoization for performance (`useMemo`, `useCallback`)
- Proper TypeScript prop interfaces for all components
- Event handlers follow `handle*` naming pattern

### State Management
- Use `useState` for local component state
- Custom hooks for complex state logic
- localStorage persistence for user preferences
- Mendix integration through props and microflows

### Error Handling
- Null checks before array/object access
- Try-catch blocks for async operations
- Proper TypeScript optional chaining (`?.`) and nullish coalescing (`??`)
- Validation for user inputs and external data

## Mendix Integration

### Entity & Data Handling
- Menu data comes from Mendix entities through props
- Use `mx.data.get()` for fetching Mendix data
- Respect Mendix security contexts and role-based access
- Follow Mendix naming conventions for entity attributes

### Microflow Integration
- Call microflows through props (`props.onAction`)
- Handle async microflow executions with proper error handling
- Return values should match expected Mendix data types

## SCSS & Styling

### Class Naming
- Use BEM-like methodology: `.block__element--modifier`
- Prefix widget-specific classes: `nav-`, `bangarlab-`
- Layout-specific classes: `layout-vertical`, `layout-horizontal`
- State classes: `.collapsed`, `.expanded`, `.active`

### Structure
```scss
.nav-sidebar {
  // Layout styles
  
  &__content {
    // Child element styles
  }
  
  &--collapsed {
    // Modifier styles
  }
  
  .depth-0, .depth-1, .depth-2 {
    // Depth-specific styles
  }
}
```

## Testing Guidelines

### Unit Tests
- Test components with React Testing Library
- Test hooks separately
- Mock external dependencies (Mendix APIs, localStorage)
- Use descriptive test names with `it()` or `test()`

### E2E Tests
- Use Cypress for end-to-end testing
- Test user flows: navigation, bookmark management, drag-drop
- Test Mendix integration scenarios
- Include accessibility testing

## Internationalization

- Support Korean and English languages
- Korean comments are acceptable in source code
- UI text should be internationalized where applicable
- Date/number formatting should respect locale

## Performance Considerations

- Use `useMemo` for expensive computations
- `useCallback` for event handlers passed to children
- Lazy load heavy components if needed
- Optimize re-renders with proper dependency arrays
- Consider bundle size impact when adding dependencies

## Git Workflow

- Feature branches for new functionality
- Commit messages follow conventional format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Pull reviews required for all changes

## Security

- Never commit secrets or API keys
- Validate all user inputs
- Sanitize external data
- Follow Mendix security best practices
- Use Content Security Policy where applicable

## Development Workflow

1. Always run `npm run lint` before committing
2. Run `npm run test:unit` for affected code
3. Test with Mendix development server (`npm start`)
4. Check both vertical and horizontal layouts
5. Verify bookmark functionality works correctly
6. Test responsive design on different screen sizes

## Common Patterns

### Custom Hook Structure
```typescript
export function useCustomHook(params: ParamsType): ReturnType {
  const [state, setState] = useState<StateType>(initialState);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handler = useCallback((...args) => {
    // Handler logic
  }, [dependencies]);
  
  return { state, handler };
}
```

### Component Structure
```typescript
interface ComponentProps {
  // Prop definitions
}

export function Component(props: ComponentProps): ReactElement {
  // Hooks and state
  
  const handleSomething = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  const classes = classNames(
    "base-class",
    { "modifier-class": condition },
    props.customClass
  );
  
  return (
    <div className={classes}>
      {/* JSX content */}
    </div>
  );
}
```

## Tools & Configuration

- **ESLint**: Extends `@mendix/pluggable-widgets-tools/configs/eslint.ts.base.json`
- **Prettier**: Extends base Mendix config with XML plugin support
- **TypeScript**: Base config from Mendix tools with `baseUrl: "./"`
- **Node**: Requires Node.js >= 16

## Dependencies

Key dependencies:
- `react-beautiful-dnd`: Drag and drop functionality
- `react-complex-tree`: Tree component for bookmarks
- `react-icons`: Icon library
- `classnames`: Conditional CSS classes

Only add new dependencies when absolutely necessary and ensure they work within the Mendix widget context.