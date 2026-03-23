# 🚀 Gasto - Quick Start Guide

## What is Gasto?

Gasto is a modern mobile expense tracking app built with **React Native** and **Expo SDK** (latest v54). Track your spending, monitor categories, and take control of your finances - all on your phone!

## ⚡ Quick Start (2 minutes)

### Step 1: Start the App

```bash
cd /Users/jeki/Documents/gasto
npm start
```

### Step 2: Choose Your Platform

In the terminal, press:

- `i` → Run on iOS Simulator (macOS)
- `a` → Run on Android Emulator
- `w` → Run in Web Browser
- → Scan QR code with Expo Go app

### Step 3: Start Using!

1. Go to **Add** tab (➕) to add your first expense
2. Fill in: **Amount**, **Description**, **Category**, **Payment Method**
3. Tap "Add Expense"
4. View your dashboard on **Home** (🏠) tab
5. Browse all expenses in **Expenses** (📊) tab

## 📋 Feature Overview

| Feature      | Where        | What                                              |
| ------------ | ------------ | ------------------------------------------------- |
| Dashboard    | Home         | See total spending, top category, recent expenses |
| Add Expense  | Add tab      | Quick form to log spending                        |
| View History | Expenses tab | Full list with filters (week/month/year)          |
| Statistics   | Home         | Category breakdown with progress bars             |
| Settings     | Settings     | App preferences and data management               |

## 🎯 Main Screens

### 🏠 Home (Dashboard)

```
Welcome back! [Date]
┌─────────────────────────┐
│ This Month              │
├─────┬──────┬────────────┤
│ $XX │ N    │ Top: $XX   │
│ Spent│Trans │ Category   │
└─────┴──────┴────────────┘

Spending by Category:
├─ 🍔 Food & Dining [████░] $XX
├─ 🚗 Transportation [██░░░] $XX
└─ ...

Recent Expenses:
├─ 🍔 Lunch - $15.50
├─ 🚗 Gas - $45.00
└─ ...
```

### ➕ Add Expense

```
Add Expense

$ [0.00]        ← Amount
What did you   ← Description
spend on?

🍔 🚗 🎬 🛍️   ← Category selector
   (horizontal scroll)

💵 💳 📱 📌   ← Payment method
Cash Card Digital Other

[Add Expense]  ← Submit button
```

### 📊 Expenses List

```
Filters: [All] [Week] [Month] [Year]

Wednesday, March 20, 2024
├─ 🍔 Lunch - $15.50
├─ ☕ Coffee - $4.20

Tuesday, March 19, 2024
├─ 🛍️ Shopping - $89.99
└─ 🎬 Movie - $12.00
```

### ⚙️ Settings

```
App Settings
├─ Notifications ON/OFF
├─ Dark Mode (coming soon)
└─ Currency USD

Data Management
├─ 📤 Export Data
└─ 🗑️ Clear All Data

About
└─ Gasto v1.0.0
```

## 💡 Key Concepts

### Categories

Pre-configured with emojis and colors:

- 🍔 Food & Dining (Red)
- 🚗 Transportation (Teal)
- 🎬 Entertainment (Mint)
- 🛍️ Shopping (Pink)
- ⚡ Utilities (Purple)
- 🏥 Health (Light Pink)
- 📚 Education (Light Blue)
- 📌 Other (Lavender)

### Payment Methods

Choose how you paid:

- **💵 Cash** - Physical money
- **💳 Card** - Credit/Debit card
- **📱 Digital** - Mobile pay, e-wallet
- **📌 Other** - Check, transfer, etc.

### Statistics

Daily calculations:

- **Total Spent** - Sum of all expenses this month
- **Transaction Count** - How many expenses logged
- **Top Category** - Where you spent most
- **Category Breakdown** - Visual progress bar per category

### Data Storage

All your data stays on your phone:

- Stored locally in device memory
- No cloud sync (privacy-first)
- Persistent between app sessions
- Can be cleared anytime from Settings

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser

# Code quality
npm run lint     # Check for issues

# Reset to template
npm run reset-project
```

## 🎨 Customization

### Change Primary Color

Find `#FF6B6B` in these files and replace:

- `components/StatCard.tsx` - Card colors
- `components/ExpenseItem.tsx` - Amount text
- `app/(tabs)/add-expense.tsx` - Button color
- `app/(tabs)/_layout.tsx` - Tab active color

### Add New Category

Edit `hooks/useExpenses.ts`:

```typescript
const DEFAULT_CATEGORIES: Category[] = [
  // ... existing categories
  { id: "9", name: "Groceries", icon: "🛒", color: "#2ECC40" },
];
```

### Change App Name

Edit `app.json`:

```json
{
  "expo": {
    "name": "Your New Name",
    "slug": "your-slug"
  }
}
```

## 📊 Example Usage

### Adding Your First Expense

1. Open app → **Add** tab
2. Enter: `$12.50` → Amount
3. Type: `Coffee at Starbucks` → Description
4. Select: 🍔 Food & Dining → Category
5. Choose: 💳 Card → Payment
6. Tap: **Add Expense**
7. See it on **Home** and **Expenses** tabs!

### Viewing Monthly Report

1. Go to **Home** tab
2. Scroll down to see "This Month" stats
3. View "Spending by Category" breakdown
4. See recent expenses list

### Filtering by Time Period

1. Go to **Expenses** tab
2. Tap filter buttons at top:
   - **All** - Everything ever
   - **Week** - Last 7 days
   - **Month** - Last 30 days
   - **Year** - Last 365 days
3. Tap expense to see details
4. Swipe/tap delete icon to remove

## 🐛 Troubleshooting

### App won't start

```bash
# Clear cache and restart
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

### Simulator not opening

```bash
# Make sure simulator is running
# macOS: open -a Simulator
# Then press 'i' in npm start terminal
```

### Data not persisting

- Check phone storage isn't full
- Verify app has storage permissions
- Try clearing app cache and restarting

### Port already in use

```bash
# Find process using 8081
lsof -i :8081
# Kill it
kill -9 <PID>
# Restart dev server
npm start
```

## 📚 Learn More

- **Official Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **TypeScript**: https://www.typescriptlang.org
- **Expo Router**: https://docs.expo.dev/routing/introduction/

## 📁 File Reference

```
Your App Structure:
├── app/(tabs)/
│   ├── index.tsx        ← Home dashboard
│   ├── add-expense.tsx  ← Add form
│   ├── expenses.tsx     ← Expense list
│   └── settings.tsx     ← Settings
├── components/
│   ├── StatCard.tsx     ← Stat display
│   ├── ExpenseItem.tsx  ← List item
│   └── CategorySelector.tsx ← Category picker
├── hooks/
│   └── useExpenses.ts   ← All logic here!
└── types/
    └── expense.ts       ← TypeScript types
```

## ✨ Next Steps

After exploring the app:

1. **Customize** - Change colors, add categories
2. **Explore Code** - Read DEVELOPMENT.md for architecture
3. **Extend** - Add budgets, notifications, exports
4. **Deploy** - Build for App Store/Play Store (Expo Build)

## 🎉 You're All Set!

Start tracking expenses now:

```bash
npm start
```

Pick a platform (i/a/w) and tap **Add** tab to log your first expense!

---

**Questions?** Check DEVELOPMENT.md for detailed architecture and customization guide.

**Report bugs?** Look for errors in your terminal or use React Native Debugger.

**Happy tracking!** 💰
