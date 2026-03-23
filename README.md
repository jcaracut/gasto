# Gasto - Expense Tracker App

A modern, feature-rich expense tracking mobile application built with React Native and Expo SDK. Gasto helps you effortlessly manage your daily expenses, categorize spending, and stay within budget.

## 📱 Features

### Core Features

- **Dashboard**: Real-time overview of monthly spending with statistics
- **Add Expenses**: Quick and intuitive expense entry with multiple payment methods
- **Expense History**: View and manage all expenses with filtering options
- **Categories**: Pre-defined expense categories with emoji icons and color coding
- **Statistics**: Visual breakdown of spending by category with progress bars
- **Settings**: App configuration and data management

### Key Capabilities

- **Persistent Storage**: All data saved locally using AsyncStorage
- **Real-time Calculations**: Instant statistics and spending summaries
- **Multiple Payment Methods**: Cash, Card, Digital, and Other
- **Date Filtering**: View expenses by time period (All time, This week, This month, This year)
- **Category Management**: 8 default categories with customization options
- **Budget Tracking**: Set and monitor budget limits per category (expandable feature)

## 🛠 Tech Stack

- **Framework**: React Native with TypeScript
- **SDK**: Expo (Latest - v54.0.33)
- **Navigation**: Expo Router (Tab-based navigation)
- **State Management**: Custom hooks with React hooks
- **Data Persistence**: AsyncStorage
- **Styling**: React Native StyleSheet

## 📦 Project Structure

```
gasto/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation configuration
│   │   ├── index.tsx            # Home/Dashboard screen
│   │   ├── add-expense.tsx      # Add expense form
│   │   ├── expenses.tsx         # Expenses list with filtering
│   │   ├── settings.tsx         # Settings and preferences
│   │   └── explore.tsx          # (unused - can be removed)
│   ├── _layout.tsx              # Root app layout
│   └── modal.tsx                # Modal screen template
├── components/
│   ├── StatCard.tsx             # Statistics display component
│   ├── ExpenseItem.tsx          # Individual expense list item
│   └── CategorySelector.tsx      # Category selection interface
├── hooks/
│   └── useExpenses.ts           # Custom hook for expense management
├── types/
│   └── expense.ts               # TypeScript type definitions
├── constants/
├── assets/
├── app.json                     # Expo app configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.17.0 or higher recommended)
- npm or yarn
- Expo CLI (optional but recommended)
- iOS Simulator/Android Emulator or physical device

### Installation

1. **Navigate to project directory**

   ```bash
   cd /Users/jeki/Documents/gasto
   ```

2. **Install dependencies** (already done)

   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

### Running on Different Platforms

**iOS (macOS only)**

```bash
npm run ios
```

**Android**

```bash
npm run android
```

**Web**

```bash
npm run web
```

**Using Expo Go**

- Run `npm start`
- Scan the QR code with Expo Go app on your phone
- App will load instantly

## 📋 Available Scripts

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `npm start`             | Start the Expo development server |
| `npm run ios`           | Run on iOS simulator              |
| `npm run android`       | Run on Android emulator           |
| `npm run web`           | Run in web browser                |
| `npm run lint`          | Check code quality with ESLint    |
| `npm run reset-project` | Reset to default Expo template    |

## 🎨 Default Categories

1. **Food & Dining** 🍔 (#FF6B6B - Red)
2. **Transportation** 🚗 (#4ECDC4 - Teal)
3. **Entertainment** 🎬 (#95E1D3 - Mint)
4. **Shopping** 🛍️ (#F38181 - Pink)
5. **Utilities** ⚡ (#AA96DA - Purple)
6. **Health** 🏥 (#FCBAD3 - Light Pink)
7. **Education** 📚 (#A8D8EA - Light Blue)
8. **Other** 📌 (#C7CEEA - Lavender)

## 💾 Data Storage

Gasto uses AsyncStorage to persist data locally on the device:

### Storage Keys

- `@gasto_expenses` - Array of all expenses
- `@gasto_categories` - Custom and default categories
- `@gasto_budgets` - Budget configurations

Data is automatically saved when:

- An expense is added
- An expense is deleted or updated
- A category is created
- A budget is set

## 🔄 App Navigation

### Tab Navigation (Bottom Menu)

1. **Home** (🏠) - Dashboard with statistics and recent expenses
2. **Add** (➕) - Quick expense entry form
3. **Expenses** (📊) - Full expense list with filtering
4. **Settings** (⚙️) - App preferences and data management

## 🧮 How It Works

### Adding an Expense

1. Navigate to "Add" tab
2. Enter amount (required)
3. Add description (optional)
4. Select category from list
5. Choose payment method
6. Tap "Add Expense"

### Viewing Statistics

- Dashboard shows current month's totals
- Category breakdown with visual progress bars
- Transaction count and top spending category
- Recent 5 expenses displayed on home screen

### Filtering Expenses

Navigate to "Expenses" tab to view:

- **All Time** - Complete expense history
- **This Week** - Last 7 days
- **This Month** - Current 30 days
- **This Year** - Current 12 months

Expenses are grouped by date for easy scanning.

## 🔧 Customization

### Adding Custom Categories

Modify the `DEFAULT_CATEGORIES` array in `hooks/useExpenses.ts`:

```typescript
const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Your Category", icon: "🎯", color: "#FF6B6B" },
  // ... more categories
];
```

### Styling

All styles use React Native StyleSheet. Modify colors and spacing in:

- Individual screen files in `app/(tabs)/`
- Component files in `components/`

## 📈 Future Enhancement Ideas

- **Budget Alerts**: Notifications when approaching limits
- **Reports**: Monthly/yearly spending reports with charts
- **Export**: CSV/PDF export functionality
- **Recurring Expenses**: Set up automatic recurring transactions
- **Multi-currency**: Support for different currencies
- **Cloud Sync**: Backup data to cloud
- **Dark Mode**: Full dark theme support
- **Tags**: Additional categorization beyond categories
- **Receipt Photos**: Attach photos to expenses
- **Sharing**: Share expense reports with others

## 🐛 Debugging

### Common Issues

**Port 8081 already in use**

```bash
# Find and kill the process
lsof -i :8081
kill -9 <PID>
```

**Module not found errors**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

**Styling issues on iOS vs Android**

- Test on both platforms
- Use platform-specific styles if needed
- Check SafeAreaView implementation

## 📱 App Configuration

Edit `app.json` to modify:

- App name: `"name": "gasto"`
- Bundle identifier: `"slug": "gasto"`
- Icon and splash screen: Update image paths
- Permissions: Add if needed for future features

## 🔐 Privacy & Data

- All data is stored locally on device
- No data is sent to external servers
- Users have full control to clear data anytime
- No tracking or analytics

## 📄 License

This project is open source and available for personal use and development.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📞 Support

For issues or questions:

1. Check existing errors in the console
2. Review TypeScript types for expected data structures
3. Verify AsyncStorage permissions on your device

## ✨ Tips for Best Performance

1. **Compress Images**: Optimize any added images
2. **Lazy Loading**: Consider splitting large expense lists
3. **Debounce Input**: Add debouncing for frequently called functions
4. **Memory Management**: Monitor storage usage over time
5. **Testing**: Test on actual devices for best results

---

**Happy expense tracking with Gasto! 💸**
