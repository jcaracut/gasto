# Gasto Project Guidelines

## Project Overview

**Gasto** is a React Native expense tracking application built with Expo and TypeScript. It provides users with comprehensive expense management capabilities including categorization, budgeting, statistics, and persistent data storage.

### Core Purpose

- Track daily expenses with categories and payment methods
- Analyze spending patterns with statistics and visualizations
- Manage budgets with period-based limits
- Persistent storage using AsyncStorage

## Technology Stack

- **Framework**: React Native 0.81.5 with Expo SDK 54.0.33
- **Language**: TypeScript 5.9.2 (strict mode enabled)
- **Navigation**: Expo Router with bottom tabs
- **State Management**: React hooks + useExpenses custom hook
- **Data Persistence**: SQLite via `expo-sqlite` (AsyncStorage retained only for the one-time data import)
- **UI Components**: Expo Icons, React Navigation
- **Code Quality**: ESLint (Expo config, 0 errors/warnings)

## Code Style & Conventions

### TypeScript

- Strict mode enabled - all code must be fully typed
- Use interfaces for data structures (located in `types/expense.ts`)
- Avoid `any` type - use proper typing
- Reference types: `Expense`, `Category`, `Budget`, `ExpenseStatistics`

### File Organization

- **Screens**: `app/(tabs)/*.tsx` - Tab-based screens
- **Components**: `components/*.tsx` - Reusable UI components
- **Hooks**: `hooks/*.ts` - Custom hooks, especially `useExpenses.ts`
- **Types**: `types/expense.ts` - TypeScript interfaces
- **Utils**: `utils/*.ts` - Helper functions (e.g., currency formatting)
- **Constants**: `constants/theme.ts` - Theme and design tokens

### Naming Conventions

- Components: PascalCase (e.g., `CategorySelector.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useExpenses.ts`)
- Files: Match exported component/hook name
- Screen files: kebab-case (e.g., `add-expense.tsx`)

### Import Organization

1. React/Expo imports
2. React Navigation imports
3. Custom components
4. Custom hooks
5. Types and utilities
6. Constants and styles

## Architecture

### Data Flow

```
User Input (Screen)
  ↓
useExpenses Hook (state management)
  ↓
Function Call (addExpense, updateExpense, deleteExpense, etc.)
  ↓
AsyncStorage Save
  ↓
State Update → Screen Re-render
```

### Component Hierarchy

- **App** (`_layout.tsx`) - Root layout with modal support
- **Tabs** (`(tabs)/_layout.tsx`) - Bottom tab navigation
  - **Home/Dashboard** (`index.tsx`) - Statistics and overview
  - **Add Expense** (`add-expense.tsx`) - Form to create expenses
  - **Expenses List** (`expenses.tsx`) - View, filter, delete expenses
  - **Settings** (`settings.tsx`) - Configuration options

### Critical Hook: useExpenses

Located in `hooks/useExpenses.ts`, this hook manages:

- **State**: expenses array, categories, budgets
- **CRUD**: addExpense, updateExpense, deleteExpense
- **Analysis**: getStatistics, getExpensesByCategory, getExpensesByDateRange
- **Persistence**: Automatic AsyncStorage sync via useEffect

Always import and use this hook for expense operations. Example:

```typescript
const { expenses, addExpense, deleteExpense, getStatistics } = useExpenses();
```

## Storage Layer (expo-sqlite)

All data persists in a local **SQLite** database (`gasto.db`) via `expo-sqlite`. `expo-sqlite` is a first-party Expo module bundled into Expo Go, so no custom dev build or config plugin work is required.

### `db/database.ts`

Single source of truth for the database:

- `getDatabase()` — cached singleton `SQLite.SQLiteDatabase` (lazy `openDatabaseAsync`).
- `initDatabase()` — creates the schema (`CREATE TABLE IF NOT EXISTS`) and runs the one-time AsyncStorage import. Idempotent; safe to call from every hook on load.
- One-time migration: imports any legacy `@gasto_*` AsyncStorage data into SQLite, seeds default categories / Personal space / default accounts, then sets `meta.migrated = "1"`.
- Exports shared helpers: `generateId()`, `DEFAULT_CATEGORIES`, `createDefaultSpace()`, `setMeta()`.

### Tables

`expenses`, `categories`, `budgets`, `spaces`, `income`, `accounts`, and `meta` (key/value — stores `current_space_id` and the `migrated` flag). Booleans (e.g. `spaces.isArchived`) are stored as `0/1` integers and converted on read.

### Hook pattern

Each domain hook (`useExpenses`, `useIncome`, `useAccounts`) keeps an in-memory React state mirror for instant UI, and writes through to SQLite with `db.runAsync(...)` on every mutation. Reads use `db.getAllAsync<T>(...)`. **Don't call SQLite directly from screens** — go through the hooks.

## Income Feature

- Types: `Income` (`id`, `amount`, `source`, `description`, `date`) and `IncomeSource` union in `types/expense.ts`. Income is **global** — not tied to a space.
- Source options live in `constants/finance.ts` (`INCOME_SOURCES`).
- `hooks/useIncome.ts`: `addIncome`, `deleteIncome`, `updateIncome`, `getMonthlyIncome()`, `getIncomeByDateRange()`.
- UI: the **Add** tab (`app/(tabs)/add-expense.tsx`) has an Expense/Income toggle. Income mode shows a simplified form (amount, source, optional description). Income history appears on the Wealth tab.

## Net Worth Feature

- Types: `Account` (`id`, `name`, `type`, `icon`, `balance`, `updatedDate`, `sortOrder`) and `AccountType` union. Account icons/types are in `constants/finance.ts`.
- `hooks/useAccounts.ts`: `addAccount`, `updateAccount`, `deleteAccount`, `getNetWorth()`. BPI / Maya / GCash are seeded as defaults on first run; users can add/rename/delete any account.
- UI: the **Wealth** tab (`app/(tabs)/net-worth.tsx`) shows total net worth, the editable accounts list (tap to edit, modal modeled on `SpaceManager`), and this month's income. The dashboard shows a net-worth card plus an income-vs-expense net-flow row.

## Build & Test

### Development

```bash
npm start              # Start Expo development server
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device
npm run web            # Run in web browser
```

### Code Quality

```bash
npm run lint           # Run ESLint (must pass before commits)
```

### Reset Project

```bash
npm run reset-project  # Resets to initial project state (caution: deletes data)
```

## Key Files Reference

| File                              | Purpose                                             |
| --------------------------------- | --------------------------------------------------- |
| `db/database.ts`                  | SQLite open, schema, one-time AsyncStorage import   |
| `hooks/useExpenses.ts`            | Complete expense management logic and state         |
| `hooks/useIncome.ts`              | Global income management (add/delete/monthly total) |
| `hooks/useAccounts.ts`            | Account balances + net worth calculation            |
| `types/expense.ts`                | TypeScript interfaces for all data types            |
| `constants/finance.ts`            | Income sources + account icon/type options          |
| `components/ExpenseItem.tsx`      | Individual expense display component                |
| `components/CategorySelector.tsx` | Category selection dropdown/picker                  |
| `components/StatCard.tsx`         | Statistics display card                             |
| `app/(tabs)/index.tsx`            | Home/Dashboard (net worth + income/expense cards)   |
| `app/(tabs)/add-expense.tsx`      | Add screen with Expense/Income toggle               |
| `app/(tabs)/expenses.tsx`         | Expenses list with filters                          |
| `app/(tabs)/net-worth.tsx`        | Wealth screen: net worth, accounts, income          |
| `app/(tabs)/settings.tsx`         | Settings and configuration                          |
| `constants/theme.ts`              | Colors, spacing, typography                         |
| `utils/currency.ts`               | Currency formatting utilities                       |

## Common Development Tasks

### Adding a New Expense Field

1. Update `types/expense.ts` - add field to `Expense` interface
2. Update `hooks/useExpenses.ts` - handle field in addExpense, storage
3. Update form in `add-expense.tsx` - add input field
4. Update `ExpenseItem.tsx` - display the field

### Creating a New Screen

1. Create file in `app/(tabs)/` with kebab-case name
2. Export default React component
3. Use `useExpenses` hook for data
4. Add export to `app/(tabs)/_layout.tsx` if needed

### Adding a Reusable Component

1. Create `.tsx` file in `components/`
2. Accept props with full TypeScript typing
3. Use theme colors from `constants/theme.ts`
4. Keep component focused and single-responsibility

### Working with SQLite

- Don't call SQLite directly from screens - use the domain hooks (`useExpenses`, `useIncome`, `useAccounts`)
- Always `await initDatabase()` before the first query in a hook's `loadData`
- Use parameterized queries (`db.runAsync(sql, [params])`) - never string-interpolate values
- Mirror mutations to React state for instant UI, then write through to SQLite
- Include error handling (try/catch) for storage failures

## Development Conventions

### State Management

- Use `useExpenses` hook for all expense data operations
- Don't duplicate state across components
- Leverage hook's CRUD methods rather than storing intermediate state

### Error Handling

- Wrap AsyncStorage operations in try-catch
- Provide user feedback via alerts or toast notifications
- Log errors to console for debugging

### Performance

- Use React.memo for list items that don't change frequently
- Implement filtering before rendering large lists
- Avoid creating new objects/functions in render in hot paths

### Testing

- Components should work with mock useExpenses hook data
- Use consistent test data structure from `types/expense.ts`
- Verify AsyncStorage interactions with proper cleanup

## Documentation References

- **QUICKSTART.md** - Quick setup guide (2 minutes to run)
- **README.md** - Complete user guide and features
- **FEATURES.md** - Detailed feature descriptions
- **DEVELOPMENT.md** - Deep technical documentation
- **INDEX.md** - Project structure map

## Common Patterns

### Using useExpenses Hook

```typescript
const { expenses, addExpense, deleteExpense, getStatistics } = useExpenses();
```

### Currency Display

```typescript
import { formatCurrency } from '@/utils/currency';
<Text>{formatCurrency(expense.amount)}</Text>
```

### Category Lookup

```typescript
const categoryColor = expense.category; // Maps to color in CategorySelector
```

### Filter by Date Range

```typescript
const filtered = expenses.filter(
  (e) => new Date(e.date) >= startDate && new Date(e.date) <= endDate,
);
```

## When Working with the Stack

1. **Adding features**: Always start with hook logic, then UI
2. **Fixing bugs**: Check hook first, then components
3. **Performance issues**: Profile with Expo DevTools
4. **Data issues**: Verify AsyncStorage via console.log in useEffect
5. **UI issues**: Check theme constants and component props

---

**Last Updated**: 2026-04-13  
**Project Version**: 1.0.0  
**Gasto** - Expense tracking made simple.
