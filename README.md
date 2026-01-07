# 💰 Money Mapper Monitor v2

A modern, full-stack money management application built with Nuxt 4, Vue 3, and Vuetify 3. Track your income allocations across multiple pockets with a beautiful, responsive interface.

## ✨ Features

- 🔐 **Secure Authentication** - Powered by Clerk
- 📚 **Multiple Money Books** - Organize finances by categories
- 💼 **Pocket Management** - Allocate money to different pockets with percentage-based distribution
- 📊 **Allocation History** - Track all your income allocations with detailed breakdowns
- 📈 **Investment Tracking** - Track holdings across multiple platforms (gold, stocks, ETF, crypto, etc.)
- 🔄 **Auto-Calculation** - Smart quantity and current value calculation
- 📱 **Responsive Design** - Optimized for mobile, tablet, and desktop
- 🎨 **Modern UI** - Clean, fresh design with Vuetify Material Design components
- ⚡ **Real-time Updates** - Instant UI updates with Vue 3 Composition API
- 🌐 **SSR Ready** - Server-side rendering with Nuxt 4

## 🛠️ Tech Stack

### Frontend
- **Nuxt 4** - Vue framework with SSR
- **Vue 3** - Progressive JavaScript framework
- **Vuetify 3** - Material Design component library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool

### Backend
- **Nuxt Server API** - API routes
- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Clerk** - Authentication and user management

### Deployment
- **Netlify** - Hosting and CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- pnpm (recommended) or npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/zulkamaula/money-mapper-monitor-v2.git
cd money-mapper-monitor-v2
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Clerk Authentication
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_JWT_ISSUER=https://xxx.clerk.accounts.dev

# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host/database
```

4. Run database migrations
```bash
# Core schema
psql $NEON_DATABASE_URL -f server/db/schema.sql

# Investment tracking schema
psql $NEON_DATABASE_URL -f server/db/investment-schema.sql

# If upgrading existing database, run migrations:
psql $NEON_DATABASE_URL -f server/db/migrations/add_purchase_date_to_holdings.sql
```

5. Start development server
```bash
pnpm dev
```

Visit `http://localhost:3000`

## 📦 Project Structure

```
m3-nuxt/
├── app.vue                 # Root application component
├── assets/
│   └── css/
│       └── main.css       # Global styles
├── components/            # Vue components
│   ├── AllocationDialog.vue
│   ├── AllocationsHistory.vue
│   ├── AppFooter.vue
│   ├── AppNavbar.vue
│   ├── HoldingDialog.vue
│   ├── InvestmentPortfolio.vue
│   ├── LegalDocument.vue
│   ├── LoginForm.vue
│   ├── MoneyBookSelector.vue
│   ├── PocketsManager.vue
│   └── PortfolioSummaryCard.vue
├── layouts/              # Layout components
│   ├── blank.vue        # Minimal layout (login)
│   └── default.vue      # Main layout with navbar/footer
├── middleware/          # Route middleware
│   └── auth.ts         # Authentication guard
├── pages/              # Application pages
│   ├── about.vue
│   ├── contact.vue
│   ├── dashboard.vue
│   ├── index.vue       # Landing/login page
│   ├── privacy.vue
│   └── terms.vue
├── plugins/
│   └── vuetify.ts      # Vuetify configuration
├── server/
│   ├── api/            # API endpoints
│   │   ├── allocations.get.ts
│   │   ├── allocations.post.ts
│   │   ├── allocations/[id].delete.ts
│   │   ├── holdings.get.ts
│   │   ├── holdings.post.ts
│   │   ├── holdings/[id].delete.ts
│   │   ├── holdings/[id].patch.ts
│   │   ├── money-books.get.ts
│   │   ├── money-books.post.ts
│   │   ├── pockets.get.ts
│   │   ├── pockets.post.ts
│   │   ├── pockets/[id].delete.ts
│   │   └── pockets/[id].patch.ts
│   ├── db/             # Database utilities
│   │   ├── schema.sql
│   │   ├── investment-schema.sql
│   │   └── migrations/
│   ├── middleware/
│   │   └── auth.ts    # Server-side auth
│   ├── types/
│   │   └── index.ts   # Server types
│   └── utils/
│       ├── auth.ts    # Auth utilities
│       └── db.ts      # Database client
├── types/
│   └── models.ts      # Type definitions
├── utils/
│   └── format.ts      # Formatting utilities
├── netlify.toml       # Netlify configuration
├── nuxt.config.ts     # Nuxt configuration
└── package.json
```

## 🔧 Development

### Build for Production
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

### Type Checking
```bash
npx nuxi typecheck
```

## 🌐 Deployment

### Netlify (Recommended)

1. Push to GitHub
```bash
git push origin main
```

2. Import to Netlify
- Connect your GitHub repository
- Configure build settings (auto-detected from `netlify.toml`)

3. Set environment variables in Netlify dashboard:
```
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_JWT_ISSUER
NEON_DATABASE_URL
```

4. Deploy!

## 📝 Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (public) | `pk_test_xxx` |
| `CLERK_JWT_ISSUER` | Clerk JWT issuer URL (private) | `https://xxx.clerk.accounts.dev` |
| `NEON_DATABASE_URL` | PostgreSQL connection string (private) | `postgresql://user:pass@host/db` |

## 🎨 Key Features Breakdown

### Money Book Management
- **Inline creation**: Quick book creation with enter key or add icon (no dialog)
- Create multiple money books for different purposes (Personal, Business, Family, etc.)
- Switch between books seamlessly with selector dropdown
- Edit and delete books with confirmation
- All books support investment tracking via allocation-based workflow

### Pocket System
- Create pockets with percentage-based allocation
- Visual feedback for total percentage (must equal 100%)
- Real-time validation

### Allocation Tracking
- Record income allocations with automatic distribution
- View allocation history with expandable details
- Copy amounts to clipboard
- Add notes to allocations

### Investment Portfolio Tracking (Allocation-Based)
- **Allocation-first approach**: Create investment holdings directly from budget allocations
- Track investments across multiple platforms (Tokopedia Emas, Bibit, Stockbit, IPOT, etc.)
- Support for various asset types: Gold, Stocks, ETF, Mutual Funds, Bonds, Crypto
- Allocation tracking: Monitor how much budget is distributed to holdings
- Purchase date tracking for historical analysis
- **Simulate feature**: Calculate net wealth with current market prices (no external API)
  - Input current prices manually per holding
  - Real-time profit/loss calculation with percentage display
  - Comparison chart: Initial vs Current value trends
  - Temporary calculation (not saved to database)

### Responsive Design
- Mobile-first approach
- Collapsible cards on mobile
- Sticky action buttons for better UX
- Optimized text sizes and spacing

## 🚧 TODO: Allocation-Based Investment Workflow

### Phase 0: Database Migration (Priority: CRITICAL) ⚠️ **RUN THIS FIRST**
**File Location:** `server/db/migrations/simplify_holdings_schema.sql`

**⚠️ IMPORTANT: Run migration BEFORE testing Phase 1-5 features!**

#### Migration Steps:
1. **Backup your database first!**
   ```bash
   # Neon Console > Your Database > Backup
   # OR export via SQL:
   pg_dump -h your-host -U your-user -d your-db > backup_$(date +%Y%m%d).sql
   ```

2. **Run migration in Neon SQL Editor:**
   - Go to Neon Console → SQL Editor
   - Open file: `server/db/migrations/simplify_holdings_schema.sql`
   - Copy & paste the entire SQL content
   - Click "Run" to execute

3. **Verify migration success:**
   ```sql
   -- Check holdings table (should NOT have average_price, current_value)
   \d holdings
   
   -- Check money_books table (should NOT have has_investment_portfolio)
   \d money_books
   
   -- Verify data integrity
   SELECT COUNT(*) FROM holdings;
   ```

#### What This Migration Does:
- ✅ Removes `average_price` column from `holdings` (simulate-only)
- ✅ Removes `current_value` column from `holdings` (simulate-only)
- ✅ **Keeps** `quantity` column (tracks what you own)
- ✅ Removes `has_investment_portfolio` flag from `money_books`
- ✅ All books now support investment tracking

#### After Migration:
- Frontend code is already updated and ready
- Phase 1-5 features will work correctly
- Continue to Phase 3 for Simulate Dialog

---

### Phase 1: Allocation Integration (Priority: HIGH) ✅ COMPLETED
- [x] **AllocationDialog Enhancement**
  - [x] Add "+ Add Invest Holding" button in expanded allocation card
  - [x] Add badge/chip showing count of holdings linked to allocation
  - [x] Implement allocation remaining amount tracking
  - [x] Disable button when allocation fully distributed (remaining = 0)
  - [x] Button label changes to "Full Allocated" when disabled
  - [x] Load holdings on mount and when book changes
  - [x] Refresh holdings after creating new holding

### Phase 2: Simplified Holding Creation (Priority: HIGH) ✅ COMPLETED
- [x] **HoldingDialog Adaptation**
  - [x] Detect if opened from allocation context (allocationContext prop)
  - [x] Auto-fill `initial_investment` from allocation context
  - [x] Auto-fill `linked_allocation_id` (disabled/readonly with hint)
  - [x] Allow user to input partial amount (editable initial_investment)
  - [x] Keep existing fields: Instrument, Platform, Purchase Date, Notes, Quantity
  - [x] Update validation logic for allocation-based creation
  
**Note:** Average Price and Quantity fields kept in form (will be handled differently in Phase 5 cleanup)

### Phase 3: Simulate Net Wealth Dialog (Priority: MEDIUM) ✅ COMPLETED
- [x] **Create SimulateDialog Component**
  - [x] New component: `components/SimulateDialog.vue`
  - [x] Aggregate all holdings from current money book
  - [x] For each holding, show:
    - [x] Auto-filled readonly: Asset Type, Instrument, Platform, Initial Investment, Quantity
    - [x] Editable inputs: Purchase Price (per unit), Current Market Price (per unit)
  - [x] Real-time calculation:
    - [x] Current Value = Quantity × Current Market Price
    - [x] Profit/Loss = Current Value - Initial Investment
    - [x] Profit % = (Profit/Loss ÷ Initial) × 100
  - [x] Summary section: Total Initial, Total Current, Total Profit/Loss with %
  - [x] **Important**: No database save, calculation only
  - [x] Added "Simulate Net Wealth" button in PortfolioSummaryCard
  - [x] Dialog with scrollable holdings list
  - [x] Individual profit display per holding
  - [x] Aggregate summary at bottom

### Phase 4: Portfolio Summary UI Update (Priority: MEDIUM)
- [ ] **Update PortfolioSummaryCard Component**
  - [ ] Ensure 3 info cards layout:
    - [ ] Card 1: Total Initial Invested
    - [ ] Card 2: Total Current Value
    - [ ] Card 3: Profit/Loss (amount + percentage badge)
  - [ ] Default chart: Allocation distribution (bar/pie chart)
  - [ ] Add "Simulate Net Wealth" button (bottom right of card)
  - [ ] After simulate: Switch chart to comparison line chart
    - [ ] Blue line: Initial Investment (flat)
    - [ ] Green/Red line: Current Value (above/below initial)
  - [ ] Chart toggle or auto-switch based on simulate state

### Phase 5: Database Schema Cleanup & Migration (Priority: HIGH) ✅ COMPLETED
- [x] **Simplify Holdings Table**
  - [x] Create migration: `simplify_holdings_schema.sql`
  - [x] Remove columns (simulate-only data):
    - [x] `average_price` - Not stored, only used as simulate input
    - [x] `current_value` - Not stored, calculated in simulate
  - [x] Keep essential columns:
    - [x] `initial_investment` - Amount invested (Rupiah)
    - [x] `quantity` - Amount owned (gram/shares/lots) - USER INPUT at creation
    - [x] `platform`, `instrument_name`, `purchase_date`, `notes`
    - [x] `linked_allocation_id` - Track allocation source
  - [x] Update `types/models.ts` Holding interface (remove 2 fields, keep quantity)
  - [x] Update `HoldingDialog.vue` (remove price calculations)
  - [x] Update composables: `useInvestments.ts` (remove current_value calculations)
  - [x] Update composables: `useInvestments.ts` updateHolding signature

- [x] **Remove `has_investment_portfolio` Flag**
  - [x] Add to same migration file: `simplify_holdings_schema.sql`
  - [x] Remove column from `money_books` table (migration ready)
  - [x] Remove from `types/models.ts` interface
  - [x] Remove checkbox from `CreateBookDialog.vue`
  - [x] Remove conditional logic from `dashboard.vue` (now 3-column layout always)
  - [x] Update composables: `useMoneyBooks.ts`
  - [x] Update composables: `useInvestments.ts` (removed flag check)

- [x] **Investment Holdings & Portfolio Cards**
  - [x] Always show (3-column layout for all books)
  - [x] Update InvestmentPortfolio.vue (removed profit/loss - Phase 3)
  - [x] Update PortfolioSummaryCard.vue (show only Total Invested - Phase 3 for profit)
  - [x] Add info alerts: "Use Simulate to calculate profit/loss"

**Note:** API endpoints (`holdings.post.ts`, `holdings.get.ts`, `money-books.post.ts`) will need updates when migration is run

### Phase 6: Testing & Documentation (Priority: LOW)
- [ ] Test allocation → holding creation flow
- [ ] Test allocation remaining amount tracking
- [ ] Test simulate dialog with various holdings
- [ ] Test chart switching in portfolio summary
- [ ] Update user documentation/guide
- [ ] Add inline help tooltips where needed

### Database Migration Files:
```bash
# ✅ Created: server/db/migrations/simplify_holdings_schema.sql

# Migration will:
# 1. Remove 2 columns from holdings: average_price, current_value
# 2. Keep quantity column (tracks what you own)
# 3. Remove has_investment_portfolio flag from money_books
# 4. Schema already updated to reflect simplified structure
```

### Schema Rationale:
- **Holdings Table = Investment Record + Quantity**
  - Stores: What you own (instrument, quantity), How much invested (initial), When (date), From where (allocation)
  - `quantity` is user input at creation (not auto-calculated)
  - Does NOT store: Prices (purchase/current) or calculated values
- **Simulate = Temporary Price-Based Calculation**
  - From DB: initial_investment, quantity
  - User inputs: purchase price, current price
  - Calculate: initial_value = quantity × purchase_price, current_value = quantity × current_price
  - Calculate: profit/loss, profit %
  - **Never saved to database** - prices are manual inputs for simulation only
- **Why This Design:**
  - Track what you own (quantity) for distribution monitoring
  - Prices are volatile and manual - not stored
  - Performance calculation on-demand when user wants to check

### Notes:
- **BREAKING**: Existing holdings with average_price/current_value will lose that data
- Quantity column is KEPT (not removed)
- Backup recommended before migration
- No external API needed - all prices are manual inputs in simulate

---

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

Private - All rights reserved

## 👤 Author

**Zulkariski .M**
- GitHub: [@zulkamaula](https://github.com/zulkamaula)

## 🙏 Acknowledgments

- Built with [Nuxt](https://nuxt.com/)
- UI components from [Vuetify](https://vuetifyjs.com/)
- Authentication by [Clerk](https://clerk.com/)
- Database hosted on [Neon](https://neon.tech/)
