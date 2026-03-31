# Gasto Development Guide

## Architecture Overview

### Data Flow

```
User Input (Screen)
     ↓
useExpenses Hook
     ↓
State Update (setExpenses)
     ↓
AsyncStorage Save
     ↓
Screen Re-render
```

### Component Hierarchy

```
App (_layout.tsx)
└── Tabs (_layout.tsx)
    ├── Home (index.tsx)
    │   ├── StatCard components
    │   ├── ExpenseItem components
    │   └── Category breakdown
    ├── Add Expense (add-expense.tsx)
    │   ├── CategorySelector
    │   └── Form inputs
    ├── Expenses List (expenses.tsx)
    │   ├── Filter buttons
    │   └── ExpenseItem list
    └── Settings (settings.tsx)
        └── Configuration options
```

## Key Files Explained

### `hooks/useExpenses.ts`

The heart of the app - manages all expense-related logic:

- **State Management**: expenses, categories, budgets
- **CRUD Operations**: addExpense, updateExpense, deleteExpense
- **Calculations**: getStatistics, getExpensesByCategory, getExpensesByDateRange
- **Persistence**: Automatic save/load from AsyncStorage

Key functions:

```typescript
// Add a new expense
const newExpense = await addExpense({
  amount: 50,
  category: "Food & Dining",
  description: "Lunch",
  date: new Date().toISOString(),
  paymentMethod: "card",
});

// Get monthly statistics
const stats = getStatistics(); // Returns totals, categories, highest spent

// Delete expense
await deleteExpense(expenseId);

// Filter expenses
const filtered = getExpensesByDateRange(startDate, endDate);
```

### `types/expense.ts`

TypeScript interfaces defining data structures:

```typescript
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO format
  paymentMethod: "cash" | "card" | "digital" | "other";
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Budget {
  id: string;
  category: string;
  limit: number;
  period: "monthly" | "weekly" | "yearly";
}

interface ExpenseStatistics {
  totalExpenses: number;
  averageByCategory: Record<string, number>;
  highestCategory: string;
  highestAmount: number;
  expenseCount: number;
}
```

## Screen Breakdown

### Home Screen (`app/(tabs)/index.tsx`)

**Purpose**: Dashboard with overview and insights

**Key Components**:

- Header with greeting and date
- Stats cards showing total, count, top category
- Category breakdown with progress bars
- Recent 5 expenses
- Empty state when no expenses

**Props Received**:

- expenses: Expense[]
- categories: Category[]
- statistics: ExpenseStatistics

### Add Expense (`app/(tabs)/add-expense.tsx`)

**Purpose**: Form to quickly add expenses

**Form Fields**:

1. Amount (decimal input with $ prefix)
2. Description (text area, max 100 chars)
3. Category (horizontal selector)
4. Payment Method (cash/card/digital/other buttons)

**Validation**:

- Amount must be > 0 and valid number
- Category must be selected
- Description can't be empty

**Data Flow**:

1. User fills form
2. Validation checks
3. Create Expense object
4. Call addExpense hook
5. Show success/error alert
6. Reset form and navigate back

### Expenses List (`app/(tabs)/expenses.tsx`)

**Purpose**: View all expenses with filtering

**Features**:

- Filter buttons (All, Week, Month, Year)
- Expenses grouped by date
- Date header for each group
- Delete button on each item
- Empty state message

**Filtering Logic**:

- All: No filter
- Week: Last 7 days
- Month: Last 30 days
- Year: Last 365 days

### Settings (`app/(tabs)/settings.tsx`)

**Purpose**: App configuration and preferences

**Sections**:

1. App Settings
   - Notifications (toggle)
   - Dark Mode (coming soon)
   - Currency selector
2. Data Management
   - Export data
   - Clear all data
3. About
   - App info and version

## Component Details

### StatCard Component

```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  backgroundColor?: string;
}
```

Displays a single statistic with icon and color coding.

### ExpenseItem Component

```typescript
interface ExpenseItemProps {
  expense: Expense;
  category?: Category;
  onPress?: () => void;
  onDeletePress?: () => void;
}
```

Renders individual expense in a list with:

- Category icon and color
- Description and date/time
- Amount in red
- Delete button

### CategorySelector Component

```typescript
interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string) => void;
}
```

Horizontal scrollable category buttons with:

- Category icon inside colored badge
- Category name below
- Active state highlight

## State Management Pattern

The app uses React's built-in hooks with AsyncStorage for persistence:

```typescript
// In useExpenses hook:
const [expenses, setExpenses] = useState<Expense[]>([]);

// Load on mount:
useEffect(() => {
  const loadData = async () => {
    const data = await AsyncStorage.getItem("@gasto_expenses");
    if (data) setExpenses(JSON.parse(data));
  };
  loadData();
}, []);

// Update with persistence:
const addExpense = async (expense: Omit<Expense, "id">) => {
  const newExpense = { ...expense, id: uuidv4() };
  const updated = [newExpense, ...expenses];
  setExpenses(updated);
  await AsyncStorage.setItem("@gasto_expenses", JSON.stringify(updated));
};
```

## AsyncStorage Schema

```
@gasto_expenses
[
  {
    id: "uuid-1",
    amount: 45.50,
    category: "Food & Dining",
    description: "Lunch at cafe",
    date: "2024-03-20T12:30:00.000Z",
    paymentMethod: "card"
  },
  // ... more expenses
]

@gasto_categories
[
  {
    id: "1",
    name: "Food & Dining",
    icon: "🍔",
    color: "#FF6B6B"
  },
  // ... more categories
]

@gasto_budgets
[
  {
    id: "uuid-1",
    category: "Food & Dining",
    limit: 500,
    period: "monthly"
  },
  // ... more budgets
]
```

## Performance Optimization Tips

1. **Memoization**
   - Use `useMemo` for filtered/sorted lists
   - Use `useCallback` for event handlers

2. **List Rendering**
   - Consider FlatList for large expense lists
   - Implement pagination for 1000+ expenses

3. **Data Updates**
   - Batch updates when possible
   - Avoid unnecessary re-renders

## Testing Guide

### Manual Testing Checklist

- [ ] Add expense with all required fields
- [ ] Cancel expense entry
- [ ] Delete an expense
- [ ] Switch between time filters
- [ ] Verify statistics calculations
- [ ] Test with empty state
- [ ] Test with large dataset (100+ expenses)
- [ ] Verify AsyncStorage persistence (close and reopen app)
- [ ] Test all payment methods
- [ ] Try different categories

### Test Data Setup

Add test expenses in Home screen's useEffect:

```typescript
// For development only
if (expenses.length === 0) {
  addExpense({
    amount: 50,
    category: "Food & Dining",
    description: "Test expense",
    date: new Date().toISOString(),
    paymentMethod: "card",
  });
}
```

## Common Modifications

### Change Primary Color

1. Find `#FF6B6B` in all files
2. Replace with your color
3. Update category colors as needed

### Add New Payment Method

1. Update Expense type in `types/expense.ts`
2. Add button in `add-expense.tsx`
3. Handle in any related logic

### Add New Default Category

1. Update `DEFAULT_CATEGORIES` in `useExpenses.ts`
2. Update `app.json` if needed
3. Test statistics calculations

## Debugging Tips

### Check State

```typescript
// In any screen
const { expenses, categories } = useExpenses();
console.log("Current expenses:", expenses);
console.log("Categories:", categories);
```

### Monitor AsyncStorage

```typescript
// Check what's saved
AsyncStorage.getItem("@gasto_expenses").then((data) => {
  console.log("Stored expenses:", JSON.parse(data || "[]"));
});
```

### Performance Monitoring

Use React DevTools Profiler to track:

- Render times
- Unnecessary re-renders
- Memory usage

## Future Implementation Guide

### Adding Budget Alerts

```typescript
// useExpenses.ts
const checkBudgetExceeded = (categoryName: string) => {
  const spent = stats.averageByCategory[categoryName] || 0;
  const budget = budgets.find((b) => b.category === categoryName);
  if (budget && spent > budget.limit) {
    // Trigger notification
  }
};
```

### Adding Export Feature

```typescript
// Create CSV export
const exportToCSV = () => {
  const csv =
    `Date,Description,Category,Amount,Method\n` +
    expenses
      .map(
        (e) =>
          `${e.date},${e.description},${e.category},${e.amount},${e.paymentMethod}`,
      )
      .join("\n");
  // Share CSV file
};
```

### Adding Recurring Expenses

```typescript
interface RecurringExpense extends Expense {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextOccurrence: string;
}
// Auto-create expenses on schedule
```

---

Happy coding! 🚀
