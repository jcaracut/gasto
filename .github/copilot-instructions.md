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
- **Data Persistence**: AsyncStorage
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

## 🤖 AI Features Architecture (Next-Generation Spending Tracker)

### Overview

Gasto now includes local AI features for inflation-adjusted predictions and asset rotation suggestions. All processing happens on-device—**no data is sent to external servers**.

### New Type System

Added to `types/expense.ts`:

- `AssetPrice` - Bitcoin, Gold, USD prices with change tracking
- `Prediction` - Spending forecasts and trend predictions
- `RotationSuggestion` - Asset allocation recommendations
- `AIInsight` - Unified insight categories
- `InflationAdjustment` - Real purchasing power calculations

### AI Modules

#### 1. **Inflation Module** (`utils/inflation.ts`)

Manages Philippines inflation rates with historical data (2025-2026):

- Monthly inflation rates sourced from BSP (Bangko Sentral ng Pilipinas)
- Core functions:
  - `getInflationRateForMonth(date)` - Get inflation for specific month
  - `adjustForInflation(amount, originalDate)` - Calculate real purchasing power
  - `forecastInflationAdjustedSpending(currentSpending, monthsAhead)` - Project future spending
  - `getInflationTrend()` - Current trend analysis
  - `shouldConsiderDiversification(rate)` - Trigger for asset recommendations

#### 2. **Asset Price Management** (`hooks/useAssetPrices.ts`)

Custom hook managing Bitcoin, Gold, and USD prices:

- **Default fallback prices** - Offline functionality with cached data
- **Optional online sync** - Fetches Bitcoin from CoinGecko free API when internet available
- **Price history tracking** - Maintains 90-day history for trend analysis
- **Conversion utilities**:
  - `convertPesoToAsset(pesoAmount, asset)` - ₱ → BTC/GOLD/USD
  - `convertAssetToPeso(assetAmount, asset)` - Reverse conversion

AsyncStorage keys:

- `@gasto_asset_prices` - Current prices
- `@gasto_price_history` - Historical price data
- `@gasto_last_price_sync` - Last sync timestamp

#### 3. **Heuristic AI Engine** (`utils/ai-heuristics.ts`)

Lightweight statistical analysis (no ML libraries):

- **Anomaly Detection**: Z-score based unusual expense identification
- **Trend Analysis**: Month-over-month spending changes
- **Monthly Forecasting**: Inflation-adjusted next month predictions
- **Category Forecasting**: Per-category spending trends
- **Recurring Expense Detection**: Identifies subscriptions/habits
- **Top Categories**: Ranked spending breakdown with trends

Core functions include all analytics needed without external ML.

#### 4. **Asset Rotation Engine** (`utils/asset-rotation.ts`)

Generates portfolio recommendations:

- **Rebalancing Suggestions**: Suggests 60/30/10 allocations (Peso/Gold/Bitcoin)
- **Opportunity Alerts**: Identifies buy opportunities when prices dip
- **Quick Recommendations**: One-liner advice for market conditions
- **Confidence Scoring**: Assessments based on inflation and market signals

Allocation strategy:

- **Base**: 70% Peso (daily use), 20% Gold (inflation hedge), 10% Bitcoin (store of value)
- **Adjusted by**: Inflation rate, BTC/Gold trends, volatility
- **Only actionable if**: Confidence > 60% and conditions warrant

### New Screens & Components

#### AI Insights Screen (`app/(tabs)/ai-insights.tsx`)

- 5th tab in bottom navigation (🤖 icon)
- Displays:
  - Current inflation rate with trend
  - Bitcoin, Gold, USD prices (live when online, cached offline)
  - Monthly spending forecast (inflation-adjusted)
  - Top spending categories with trends
  - Portfolio rotation suggestions
  - Buy opportunity alerts
- Manual refresh button for price sync
- Footer note: All computation is local, privacy-first

#### Enhanced Dashboard (`app/(tabs)/index.tsx`)

- New "AI Insights" widget below main stats
- Shows 3 cards:
  - Inflation rate + trend indicator
  - Next month forecast + confidence
  - Bitcoin price + % change
- "Get Asset Rotation Suggestions" CTA button

#### Floating Alerts (`components/AIAlerts.tsx`)

Exported components (use in modal or app root):

- `FloatingAssetAlert` - Slide-up notification with dismissible alert
- `AIInsightsBadge` - Quick status badge (for headers/modals)
- `AnomalyIndicator` - Warns when unusual spending detected

### Data Flow

```
New Expense Added
  ↓
useExpenses Hook saves to AsyncStorage
  ↓
[Optional] useAssetPrices syncs Bitcoin price from CoinGecko
  ↓
AI Insights Screen Renders:
  - inflation.ts calculates adjusted forecast
  - ai-heuristics.ts analyzes patterns
  - asset-rotation.ts generates allocation suggestions
  - Components display results with confidence scores
  ↓
All data stays local (no external APIs for expense data)
```

### Privacy & Offline Design

- **Zero data transmission** for expense information
- **Optional price fetching** (Bitcoin only via CoinGecko free API, Gold is estimated)
- **Fully functional offline** - Works without internet, uses cached prices
- **No user tracking** - All calculations local to device
- **Type-safe** - TypeScript strict mode ensures AI module integration safety

### Integration Guidelines

#### Adding to Existing Screens

Use the floating alerts in add-expense flow:

```typescript
import { AnomalyIndicator } from "@/components/AIAlerts";

// In your screen:
<AnomalyIndicator />  // Shows only if unusual detected
```

#### Extending AI Suggestions

Add new suggestion types in `asset-rotation.ts`:

1. Add type to `RotationSuggestion` type definition
2. Create generation function (e.g., `generateCustomSuggestion()`)
3. Include in `generateAssetRotationSuggestions()` return array

#### Using Inflation in Calculations

```typescript
import {
  adjustForInflation,
  forecastInflationAdjustedSpending,
} from "@/utils/inflation";

const realAmount = adjustForInflation(1000, "2025-01-01");
const nextMonth = forecastInflationAdjustedSpending(5000, 1);
```

#### Using Asset Conversions

```typescript
const { convertPesoToAsset, convertAssetToPeso } = useAssetPrices();

const btcEquivalent = convertPesoToAsset(50000, "BTC"); // ≈ 0.0188 BTC
const pesoValue = convertAssetToPeso(0.5, "BTC"); // ≈ 1,325,000 PHP
```

### Performance Considerations

- Statistics cached in `useMemo` to avoid recalculation
- Inflation calculations use simple compounding (no external math libraries)
- Price fetches are non-blocking (async/await with try-catch)
- AsyncStorage keys are namespaced (`@gasto_*`) for isolation

### Testing AI Features

1. **Offline**: Disable internet, app still works with cached prices
2. **Prediction accuracy**: Add 3+ months of expense data, forecast > 50% confidence
3. **Inflation impact**: Compare adjusted vs. raw amounts
4. **Asset conversions**: Verify round-trip conversions (PHP → BTC → PHP)
5. **Anomaly detection**: Add expense 3x normal amount, should trigger

### Future Enhancements

- Graph visualizations (charts for spending trends)
- TensorFlow Lite for predictive analytics
- Cryptocurrency portfolio tracking (store actual holdings)
- Budget alerts integrated with AI predictions
- Cloud sync option (user-opt-in)

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
| `hooks/useExpenses.ts`            | Complete expense management logic and state         |
| `hooks/useAssetPrices.ts`         | Asset price fetching and conversion utilities       |
| `types/expense.ts`                | TypeScript interfaces for all data types (incl. AI) |
| `components/ExpenseItem.tsx`      | Individual expense display component                |
| `components/CategorySelector.tsx` | Category selection dropdown/picker                  |
| `components/StatCard.tsx`         | Statistics display card                             |
| `components/AIAlerts.tsx`         | Floating alerts and AI insight badges               |
| `app/(tabs)/index.tsx`            | Home/Dashboard screen with AI widget                |
| `app/(tabs)/add-expense.tsx`      | Add expense form                                    |
| `app/(tabs)/expenses.tsx`         | Expenses list with filters                          |
| `app/(tabs)/ai-insights.tsx`      | AI Insights screen (5th tab)                        |
| `app/(tabs)/settings.tsx`         | Settings and configuration                          |
| `constants/theme.ts`              | Colors, spacing, typography                         |
| `utils/currency.ts`               | Currency formatting utilities                       |
| `utils/inflation.ts`              | **AI: Philippines inflation data & calculations**   |
| `utils/ai-heuristics.ts`          | **AI: Anomaly detection, forecasting, trends**      |
| `utils/asset-rotation.ts`         | **AI: Portfolio suggestions & rotations**           |

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

### Working with AsyncStorage

- Don't call AsyncStorage directly - use `useExpenses` hook
- Always use JSON.stringify/parse for objects
- Handle async operations in useEffect
- Include error handling for storage failures

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
