# AKURI OMA State Control - Public API Documentation

## Type Exports Overview

The AKURI OMA State Control library now provides enhanced type accessibility for external consumers, enabling seamless integration with Angular Signals and TypeScript type inference.

## UnwrapSignal Type

### Description

The `UnwrapSignal<T>` type utility extracts the unwrapped type from Angular Signal function types. This enables proper type inference when working with signal-based state management.

### Type Signature

```typescript
export type UnwrapSignal<T extends () => infer R> = R;
```

### Import Options

You can import `UnwrapSignal` from the library using two equivalent patterns:

#### Option 1: Direct from SessionStorage module
```typescript
import { UnwrapSignal } from 'akuri-oma-state-control';
```

#### Option 2: From specific module
```typescript
import { UnwrapSignal } from 'akuri-oma-state-control/lib/session-storage/session-storage.model';
// or
import { UnwrapSignal } from 'akuri-oma-state-control/lib/utils/oma-state.types';
```

Both import options provide identical functionality and type behavior.

## Usage Examples

### Basic Signal Type Unwrapping

```typescript
import { UnwrapSignal } from 'akuri-oma-state-control';

// Define a signal function type
type UserSignal = () => { id: string; name: string; email: string };

// Extract the unwrapped type
type UserType = UnwrapSignal<UserSignal>;

// This resolves to: { id: string; name: string; email: string }
const userData: UserType = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
};
```

### Complex State Management Types

```typescript
import { UnwrapSignal } from 'akuri-oma-state-control';

interface AppState {
  // Signal properties
  userProfile: () => { profile: UserProfile; preferences: UserPreferences };
  sessionData: () => SessionInfo;
  notifications: () => Notification[];
  
  // Regular properties
  theme: 'light' | 'dark';
  locale: string;
}

// Extract types for state management
type UserProfileType = UnwrapSignal<AppState['userProfile']>;
type SessionDataType = UnwrapSignal<AppState['sessionData']>;
type NotificationType = UnwrapSignal<AppState['notifications']>;

class StateManager {
  private state: {
    profile: UserProfileType;
    session: SessionDataType;
    notifications: NotificationType[];
  };

  updateProfile(profile: UserProfileType) {
    this.state.profile = profile;
  }

  addNotification(notification: NotificationType) {
    this.state.notifications.push(notification);
  }
}
```

### Blueprint Compatibility Pattern

```typescript
import { UnwrapSignal } from 'akuri-oma-state-control';

// Compatible with blueprint-style signal definitions
interface BlueprintState {
  authState: () => { user: User; token: string };
  uiState: () => { loading: boolean; error?: string };
}

// Type-safe state management
class BlueprintCompatibleService {
  private authState: UnwrapSignal<BlueprintState['authState']>;
  private uiState: UnwrapSignal<BlueprintState['uiState']>;

  constructor() {
    this.authState = { user: null, token: '' };
    this.uiState = { loading: false };
  }

  updateAuthState(newState: UnwrapSignal<BlueprintState['authState']>) {
    this.authState = newState;
  }
}
```

### Mixed Usage Patterns

```typescript
import { UnwrapSignal as UnwrapFromSession } from 'akuri-oma-state-control/lib/session-storage/session-storage.model';
import { UnwrapSignal as UnwrapFromTypes } from 'akuri-oma-state-control/lib/utils/oma-state.types';

interface MixedState {
  signalProp: () => string;
  regularProp: number;
  optionalSignal?: () => boolean;
}

// Both imports work identically
type StringType = UnwrapFromSession<MixedState['signalProp']>;
type BooleanType = UnwrapFromTypes<MixedState['optionalSignal']>;
type NumberType = UnwrapFromTypes<MixedState['regularProp']>;

function processState(
  str: StringType,
  bool: BooleanType,
  num: NumberType
) {
  // All types are properly inferred
  return `${str}-${bool}-${num}`;
}
```

## Type Safety Benefits

### 1. Compile-Time Type Checking

```typescript
import { UnwrapSignal } from 'akuri-oma-state-control';

type ProfileSignal = () => { name: string; age: number };

// ✅ Correct usage - type safety guaranteed
const profile: UnwrapSignal<ProfileSignal> = {
  name: 'Alice',
  age: 30
};

// ❌ TypeScript error - type mismatch caught at compile time
const invalidProfile: UnwrapSignal<ProfileSignal> = {
  name: 'Bob',
  age: 'thirty' // ❌ Type 'string' is not assignable to type 'number'
};
```

### 2. IDE Autocomplete Support

```typescript
import { UnwrapSignal } from 'akuri-oma-state-control';

type UserSignal = () => {
  id: string;
  profile: {
    name: string;
    email: string;
    settings: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
};

type UserType = UnwrapSignal<UserSignal>;

// IDE provides full autocomplete for nested properties
const user: UserType = {
  id: '123',
  profile: {
    name: 'John Doe',
    email: 'john@example.com',
    settings: {
      theme: 'dark', // ✅ Autocomplete suggests 'light' | 'dark'
      notifications: true // ✅ Autocomplete suggests boolean
    }
  }
};
```

### 3. Refactoring Safety

```typescript
import { UnwrapSignal } from 'akuri-oma-state-control';

interface User {
  id: string;
  name: string;
  email: string;
}

// When User interface changes, TypeScript updates all usages
type UserSignal = () => User;
type UserType = UnwrapSignal<UserSignal>;

// All instances automatically reflect the User interface changes
const user1: UserType = { id: '1', name: 'Alice', email: 'alice@example.com' };
const user2: UserType = { id: '2', name: 'Bob', email: 'bob@example.com' };
```

## Migration Guide

### From Manual Type Definitions

**Before (Manual typing):**
```typescript
// Manual type definitions
type UserType = { id: string; name: string; email: string };
type UserSignal = () => UserType;

// Manual type annotation
const user: UserType = { id: '1', name: 'Alice', email: 'alice@example.com' };
```

**After (Using UnwrapSignal):**
```typescript
// Automatic type extraction
type UserSignal = () => { id: string; name: string; email: string };
type UserType = UnwrapSignal<UserSignal>;

// Same usage, better type safety
const user: UserType = { id: '1', name: 'Alice', email: 'alice@example.com' };
```

### From Any/Unknown Types

**Before (Using any):**
```typescript
// Unsafe any usage
type UserSignal = () => any;
const user = signal(); // user is any - no type safety

// Function parameter - no type checking
function updateUser(u: any) {
  // No IDE autocomplete or type checking
  console.log(u.nam); // No error, but runtime bug
}
```

**After (Using UnwrapSignal):**
```typescript
// Type-safe signal usage
type UserSignal = () => { id: string; name: string; email: string };
type UserType = UnwrapSignal<UserSignal>;
const user = signal<UserType>({ id: '1', name: 'Alice', email: 'alice@example.com' });

// Function parameter with full type safety
function updateUser(u: UserType) {
  // Full IDE autocomplete
  console.log(u.name); // ✅ TypeScript error if property doesn't exist
}
```

## API Reference

### UnwrapSignal

**Signature:**
```typescript
export type UnwrapSignal<T extends () => infer R> = R;
```

**Parameters:**
- `T`: A function type that returns the type to be extracted

**Returns:**
- The return type `R` of the function type `T`

**Constraints:**
- `T` must be a function type `() => R`
- Uses TypeScript's `infer` keyword for type extraction

**Examples:**

```typescript
// Simple types
type StringSignal = () => string;
type UnwrappedString = UnwrapSignal<StringSignal>; // string

// Complex object types
type UserSignal = () => { id: string; name: string };
type UnwrappedUser = UnwrapSignal<UserSignal>; // { id: string; name: string }

// Array types
type ArraySignal = () => number[];
type UnwrappedArray = UnwrapSignal<ArraySignal>; // number[]
```

## Best Practices

### 1. Consistent Naming Conventions

```typescript
// ✅ Good: Clear signal naming
type UserSignal = () => User;
type ProfileSignal = () => Profile;

// ❌ Avoid: Unclear signal purpose
type Signal1 = () => User;
type DataType = () => Profile;
```

### 2. Interface-Driven Design

```typescript
// ✅ Good: Interface-first approach
interface UserState {
  currentUser: () => User;
  userPreferences: () => UserPreferences;
  isLoading: () => boolean;
}

type CurrentUserType = UnwrapSignal<UserState['currentUser']>;
type UserPreferencesType = UnwrapSignal<UserState['userPreferences']>;
type LoadingType = UnwrapSignal<UserState['isLoading']>;
```

### 3. Modular Type Organization

```typescript
// types/user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export type UserSignal = () => User;
export type UserType = UnwrapSignal<UserSignal>;

// usage.component.ts
import { UserType } from './types/user.types';

class UserComponent {
  private user: UserType;
}
```

## Troubleshooting

### Common Issues

**1. "Type 'X' does not satisfy the constraint"**
```typescript
// ❌ Error: Number is not a function
type BadSignal = number;
type Unwrapped = UnwrapSignal<BadSignal>; // Error

// ✅ Correct: Must be a function type
type GoodSignal = () => number;
type Unwrapped = UnwrapSignal<GoodSignal>; // number
```

**2. "Type 'void' is not assignable to parameter"**
```typescript
// ❌ Error: Function returns void
type VoidSignal = () => void;
const test: UnwrapSignal<VoidSignal> = undefined; // void type

// ✅ Correct: Ensure function returns a value
type StringSignal = () => string;
const test: UnwrapSignal<StringSignal> = 'hello'; // string
```

**3. Import Issues**
```typescript
// ❌ Error: Wrong import path
import { UnwrapSignal } from 'akuri-oma-state-control/lib/wrong-path';

// ✅ Correct: Use main library import
import { UnwrapSignal } from 'akuri-oma-state-control';
```

## Version Compatibility

- **Angular**: ^20.0.0 (for Signals API)
- **TypeScript**: ^5.9.0 (for infer keyword and advanced type features)
- **Library Version**: ^1.0.2

## Support

For issues, questions, or contributions, please refer to the main library documentation or create an issue in the project repository.

---

*This documentation covers the enhanced type accessibility features added in library version 1.0.2. For core library functionality, refer to the main AKURI OMA State Control documentation.*