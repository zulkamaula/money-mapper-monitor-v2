# API Patterns & Best Practices - M3 Nuxt

**Last Updated:** January 10, 2026  
**Purpose:** Document established patterns for maintainable, scalable, and predictable code

---

## 🎯 Core Principles

1. **KISS (Keep It Simple, Stupid)** - Prefer simple solutions over clever ones
2. **DRY (Don't Repeat Yourself)** - Extract common patterns
3. **No N+1 Queries** - Aggregate data in single query when possible
4. **Cache-First Strategy** - Avoid redundant API calls
5. **Explicit over Implicit** - Manual refetch > automatic watchers for cross-concern updates
6. **Component Coordination** - Components handle cross-composable logic, not composables

---

## 📡 Backend API Patterns

### ✅ Pattern 1: Aggregate Data in Single Query (Prevent N+1)

**Problem:** Fetching related data with separate API calls creates N+1 query anti-pattern.

```typescript
// ❌ ANTI-PATTERN: N+1 Queries
// Main query
GET /api/allocations?money_book_id=xxx

// Then N queries for related data
GET /api/allocations/{id1}/transactions  // +1
GET /api/allocations/{id2}/transactions  // +1
GET /api/allocations/{id3}/transactions  // +1
// Result: 1 + N API calls
```

**Solution:** Use SQL JOINs and aggregation to embed related data.

```typescript
// ✅ CORRECT: Single Query with JOINs
// server/api/allocations.get.ts
const allocations = await db`
  SELECT 
    a.id, 
    a.source_amount,
    a.date,
    -- Aggregate allocation_items
    json_agg(
      DISTINCT jsonb_build_object(
        'id', ai.id,
        'pocket_id', ai.pocket_id,
        'amount', ai.amount
      )
    ) FILTER (WHERE ai.id IS NOT NULL) as allocation_items,
    -- Aggregate transaction totals (prevents N+1!)
    COALESCE(COUNT(DISTINCT ht.id), 0)::int as transaction_count,
    COALESCE(SUM(ht.amount), 0)::numeric as total_allocated
  FROM public.allocations a
  LEFT JOIN public.allocation_items ai ON ai.allocation_id = a.id
  LEFT JOIN public.holding_transactions ht ON ht.linked_allocation_id = a.id
  WHERE a.money_book_id = ${moneyBookId}
  GROUP BY a.id
`

// Result: 1 API call returns everything
```

**Reference Implementations:**
- ✅ `server/api/allocations.get.ts` - Embeds `allocation_items`, `transaction_count`, `total_allocated`
- ✅ `server/api/pockets.get.ts` - Single query returns all pocket data
- ✅ `server/api/holdings.get.ts` - Aggregates investment data

**When to Use Separate Endpoint:**
- Paginated data (e.g., `/api/allocations/[id]/transactions?page=1&limit=20`)
- Large payloads that shouldn't be in list view
- User-triggered detail view (not automatic on list load)

---

### ✅ Pattern 2: Return Embedded Metadata

Always return summary/metadata with list responses to avoid follow-up queries.

```typescript
// ❌ BAD: Returns only list
return allocations

// ✅ GOOD: Returns list + metadata
return allocations.map(a => ({
  ...a,
  transaction_count: a.transaction_count || 0,
  total_allocated: a.total_allocated || 0
}))
```

**Benefits:**
- Frontend can display counts/totals without extra API calls
- Consistent with GraphQL best practices
- Better performance and user experience

---

### ✅ Pattern 3: Batch Operations

Prefer batch operations over multiple single operations.

```typescript
// ❌ BAD: N inserts
for (const source of budgetSources) {
  await db`INSERT INTO holding_budget_sources VALUES (${source})`
}

// ✅ GOOD: Single batch insert
await db`
  INSERT INTO holding_budget_sources ${db(budgetSources, 
    'holding_id', 'pocket_id', 'amount', 'percentage'
  )}
`
```

---

## 🎣 Frontend Composable Patterns

### ✅ Pattern 1: Cache-First with AbortController

**Composable Template:** (`composables/useXxx.ts`)

```typescript
// State
const items = ref<Item[]>([])
const loading = ref(false)
const cache = useState<Map<string, Item[]>>('items-cache', () => new Map())

// AbortController for cancelling inflight requests
let abortController: AbortController | null = null

async function loadItems(bookId: string) {
  // 1. Check cache FIRST (prevents duplicate API calls)
  const cached = cache.value.get(bookId)
  if (cached) {
    items.value = cached
    return // ✅ No API call needed
  }

  // 2. Cancel previous request if still pending
  if (abortController) {
    abortController.abort()
  }
  
  const currentController = new AbortController()
  abortController = currentController

  // 3. Fetch with abort signal
  loading.value = true
  try {
    const data = await $fetch<Item[]>(`/api/items?money_book_id=${bookId}`, {
      signal: currentController.signal
    })
    
    // 4. Only update if not aborted (handles rapid book switching)
    if (abortController === currentController) {
      items.value = data
      cache.value.set(bookId, data) // ✅ Cache for next time
    }
  } catch (error: any) {
    // 5. Ignore AbortErrors (expected behavior)
    if (error.cause?.name === 'AbortError' || error.name === 'AbortError') {
      return
    }
    console.error('Failed to load items:', error)
  } finally {
    // 6. Clean up only if this request is still current
    if (abortController === currentController) {
      abortController = null
      loading.value = false
    }
  }
}

// Manual cache invalidation
function invalidateCache(bookId?: string) {
  if (bookId) {
    cache.value.delete(bookId)
  } else {
    cache.value.clear()
  }
}

return {
  items: readonly(items),
  loading: readonly(loading),
  loadItems,
  invalidateCache
}
```

**Reference Implementations:**
- ✅ `composables/useInvestments.ts`
- ✅ `composables/useAllocations.ts`
- ✅ `composables/usePockets.ts`

**Key Benefits:**
- Cache prevents duplicate calls on HMR (Hot Module Reload)
- AbortController prevents stale data on rapid book switching
- Explicit loading state for UI feedback
- Manual cache invalidation for updates

---

### ✅ Pattern 2: Call Composables at Top Level

**Critical Rule:** NEVER call composables inside functions (causes memory leaks and reactivity issues).

```typescript
// ❌ WRONG: Composable called inside function
async function createHolding() {
  const { selectedBook } = useMoneyBooks() // ❌ Memory leak!
  await $fetch('/api/holdings', { 
    body: { money_book_id: selectedBook.value.id }
  })
}

// ✅ CORRECT: Composable called at top level
const { selectedBook } = useMoneyBooks() // ✅ At module scope

async function createHolding() {
  await $fetch('/api/holdings', { 
    body: { money_book_id: selectedBook.value.id }
  })
}
```

**Reference:** Fixed in `composables/useInvestments.ts` (commit: Jan 10, 2026)

---

### ✅ Pattern 3: Single Responsibility

Composables should manage ONE domain only. Cross-concern coordination happens in components.

```typescript
// ❌ WRONG: useAllocations calling useInvestments
// composables/useAllocations.ts
async function deleteAllocation(id: string) {
  await db.delete(id)
  
  const { loadInvestments } = useInvestments() // ❌ Cross-composable call
  await loadInvestments() // ❌ Tight coupling
}

// ✅ CORRECT: Component handles coordination
// components/AllocationsHistory.vue
async function handleDelete(id: string) {
  await deleteAllocation(id) // Allocation concern
  await loadInvestments(selectedBook.value.id) // Investment concern
}
```

**Benefits:**
- Loose coupling between composables
- Easier to test in isolation
- Clear ownership of concerns

---

## 📺 Component Patterns

### ✅ Pattern 1: Watcher Strategy

**Use `watch` with `immediate: true` for data loading on mount + updates.**

```typescript
// ✅ CORRECT: Single watcher handles mount + updates
watch(() => selectedBook.value, async (newBook) => {
  if (newBook) {
    await loadAllocations()
  }
}, { immediate: true })

// ❌ WRONG: Duplicate calls with both onMounted + watch
onMounted(async () => {
  await loadAllocations() // Called on mount
})
watch(() => selectedBook.value, async (newBook) => {
  if (newBook) {
    await loadAllocations() // Called again immediately!
  }
}, { immediate: true })
```

**Why This Works:**
- `immediate: true` triggers watcher on mount (acts like `onMounted`)
- Same watcher handles book changes
- Cache in composable prevents duplicate API calls
- Matches `PocketsManager.vue` pattern

---

### ✅ Pattern 2: Avoid Deep Watchers

Deep watchers trigger on ANY nested property change, causing performance issues.

```typescript
// ❌ WRONG: Deep watch on large array
watch(() => allocations.value, async (newAllocations) => {
  // Triggers on EVERY property change in ANY allocation!
  for (const allocation of newAllocations) {
    await fetchDetails(allocation.id)
  }
}, { deep: true }) // ❌ Performance killer

// ✅ CORRECT: Watch specific trigger only
watch(() => allocations.value.length, async () => {
  // Only triggers when allocations added/removed
  // Use data from allocations.value (has embedded counts)
})

// ✅ OR BETTER: Use embedded data (no extra fetch needed)
const remaining = computed(() => {
  return allocation.source_amount - (allocation.total_allocated || 0)
})
```

---

### ✅ Pattern 3: Manual Refetch for Cross-Concern Updates

When action in one domain affects another, manually refetch in component.

```typescript
// Dialog closes after creating holding
watch(showHoldingDialog, async (isOpen) => {
  if (!isOpen && selectedBook.value) {
    // Holding created → affects investments
    await loadInvestments(selectedBook.value.id)
    
    // Holding linked to allocation → affects allocation totals
    await loadAllocations()
    
    // ✅ Explicit, predictable, no magic watchers
  }
})
```

**Why Manual Refetch?**
- Explicit > implicit (clear when/why data refreshes)
- No complex watcher chains
- Easier to debug
- Better performance (only refetch what changed)

**Reference:** `components/AllocationsHistory.vue` lines 99-109

---

## 🔢 Number Formatting & Parsing Patterns

### ✅ Pattern: Handle Both Decimal Formats

**Problem:** Indonesia uses comma (,) for decimals, but databases return period (.) for decimals.

```typescript
// ❌ WRONG: Only handles Indonesian format
function parseNumberInput(value: string): number {
  const parts = value.split(',')
  return parseInt(parts[0].replace(/\./g, '')) || 0
}
// Bug: "3000200.00" → "300020000" (trailing zeros concatenated)

// ✅ CORRECT: Handle both formats
function parseNumberInput(value: string): number {
  let cleaned = value.replace(/Rp/gi, '').trim()
  
  // Remove decimal part FIRST (before removing thousand separators)
  const lastCommaIndex = cleaned.lastIndexOf(',')
  const lastPeriodIndex = cleaned.lastIndexOf('.')
  
  if (lastCommaIndex !== -1) {
    cleaned = cleaned.substring(0, lastCommaIndex)
  } else if (lastPeriodIndex !== -1 && cleaned.length - lastPeriodIndex <= 3) {
    cleaned = cleaned.substring(0, lastPeriodIndex)
  }
  
  // Now safe to remove thousand separators
  cleaned = cleaned.replace(/\./g, '')
  return parseInt(cleaned.replace(/[^\d]/g, '')) || 0
}
```

**Key Rules:**
1. Remove decimal parts (,00 or .00) BEFORE removing thousand separators
2. Check both comma and period as decimal separators
3. Only treat period as decimal if at end with ≤2 digits after it
4. Test with database-returned values: `"3000200.00"` → `3000200`

**Reference Implementation:** `utils/format.ts` - `parseNumberInput()`

---

## 🚫 Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: N+1 Queries

```typescript
// ❌ BAD: Loop fetching in component
for (const allocation of allocations.value) {
  const transactions = await $fetch(`/api/allocations/${allocation.id}/transactions`)
  allocationTotals.value[allocation.id] = transactions.summary
}
// Result: N API calls
```

**Solution:** Embed counts in main query (see Pattern 1).

---

### ❌ Anti-Pattern 2: Duplicate Watchers

```typescript
// ❌ BAD: Two watchers on same trigger
watch(() => selectedBook.value, loadData, { immediate: true })
watch(() => selectedBook.value, updateUI, { immediate: true })
// Result: Duplicate API calls
```

**Solution:** Single watcher, combine logic or use computed.

---

### ❌ Anti-Pattern 3: Deduplication Layers

```typescript
// ❌ BAD: Complex deduplication logic
const pendingFetches = new Set<string>()

async function fetchData(id: string) {
  if (pendingFetches.has(id)) return // Dedup layer
  pendingFetches.add(id)
  try {
    await $fetch(`/api/data/${id}`)
  } finally {
    pendingFetches.delete(id)
  }
}
```

**Problem:** Fixes symptom, not root cause.

**Solution:** Fix root cause (remove duplicate watchers, use cache-first).

---

### ❌ Anti-Pattern 4: Calling Composables in Functions

```typescript
// ❌ BAD: Composable inside function
function doSomething() {
  const { data } = useMyData() // Memory leak!
}
```

**Solution:** Call composables at top level (see Pattern 2).

---

## 📋 Checklist for New Features

When adding new features, ensure:

- [ ] **Backend:** Aggregate related data in single query (no N+1)
- [ ] **Backend:** Return embedded metadata (counts, totals, status)
- [ ] **Composable:** Implement cache-first strategy
- [ ] **Composable:** Use AbortController for cancellable requests
- [ ] **Composable:** Export readonly refs for state
- [ ] **Composable:** Called at top level, not inside functions
- [ ] **Component:** Single watcher with `immediate: true` for data loading
- [ ] **Component:** Avoid deep watchers (watch length or specific property)
- [ ] **Component:** Manual refetch for cross-concern updates
- [ ] **Component:** Handle cross-composable coordination (not in composables)
- [ ] **Types:** Update TypeScript interfaces for new fields
- [ ] **Tests:** Verify no duplicate API calls on HMR
- [ ] **Tests:** Verify correct behavior on rapid book switching

---

## 📊 Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API calls on initial load | 1 per resource type | Network tab (Chrome DevTools) |
| API calls on book switch | 1 per resource type | Network tab |
| API calls on HMR | 0 (cache hit) | Network tab + save file |
| Cache hit rate | >90% | Console logs |
| Watcher triggers | Minimal (only on actual changes) | Vue DevTools |

---

## 🔍 Debugging Tips

### Finding N+1 Queries

1. Open Chrome DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Perform action (e.g., book switch)
4. Count requests to same endpoint pattern
5. If >1 request for same resource → N+1 problem

### Finding Duplicate Watchers

1. Add console.log at watcher start:
   ```typescript
   watch(() => selectedBook.value, (newBook) => {
     console.log('[Watcher] selectedBook changed', newBook?.id)
     // ... rest of logic
   }, { immediate: true })
   ```
2. Check console for duplicate logs on same action
3. If multiple logs → duplicate watchers

### Finding Memory Leaks

1. Vue DevTools → Components tab
2. Perform action multiple times (e.g., open/close dialog 10x)
3. Check component count (should stay same)
4. If count increases → memory leak (likely composable called in function)

---

## 📚 Reference Implementations

**Perfect examples to study:**

1. **`composables/usePockets.ts`** - Cache-first, AbortController pattern
2. **`composables/useInvestments.ts`** - Top-level composable calls
3. **`components/PocketsManager.vue`** - Single watcher with immediate:true
4. **`server/api/allocations.get.ts`** - Aggregated query preventing N+1
5. **`components/AllocationsHistory.vue`** - Manual refetch for cross-concerns

---

## 🎓 Learning Resources

- **Vue 3 Composition API:** https://vuejs.org/guide/extras/composition-api-faq.html
- **Nuxt 3 Data Fetching:** https://nuxt.com/docs/getting-started/data-fetching
- **SQL JOIN Optimization:** https://use-the-index-luke.com/
- **N+1 Query Problem:** https://www.geeksforgeeks.org/what-is-the-n1-query-problem/

---

**Last Review:** January 10, 2026  
**Reviewed By:** Development Team  
**Status:** ✅ Approved - Follow these patterns for all new code
