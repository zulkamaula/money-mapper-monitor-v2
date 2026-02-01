# Allocation + Holding UX Improvements - Progress Tracker

**Date:** 2026-02-01  
**Status:** Done

---

## Scope

This document tracks progress for a set of UX improvements and bug fixes related to:
- Allocation pocket selection
- Creating holdings from allocation context
- Currency input formatting UX
- Correctness of allocation remaining amount
- API amount normalization (reduce FE parsing complexity)

---

## Progress Checklist

### 1) Allocation Dialog - Toggle Pocket Enabled/Disabled (Option A)

**Goal:** Allow excluding pockets during allocation creation without editing/deleting pockets in Pockets Manager.

**Behavior:**
- Disabled pockets are excluded from total percentage calculation.
- Allocation can proceed only when enabled pockets sum to 100%.
- Disabled pockets are not sent in `createAllocation()` payload and will not create `allocation_items`.

**Planned Changes:**
- [x] Add `enabled` flag to local allocation state in `components/AllocationDialog.vue`
- [x] Add UI toggle control per pocket row (enable/disable)
- [x] Update `totalPercentage` to sum only enabled pockets
- [x] Disable percentage input when pocket is disabled
- [x] Filter disabled pockets out from `customPockets` payload
- [x] Manual verification: ensure saved allocation does not include disabled pockets

**Primary Files:**
- `components/AllocationDialog.vue`

**Status:** Done

---

### 2) Holding Dialog - Extract Amount Buttons (25% / 50% / 100%)

**Goal:** Quick-fill amount based on reference amount when creating holding from allocation.

**Behavior:**
- Buttons appear when `allocationContext` exists.
- Reference amount is the **remaining allocation amount** passed from `AllocationsHistory`.
- Default selection: 100% (prefill remains unchanged, buttons allow quick adjustments).

**Planned Changes:**
- [x] Add `referenceAmount` computed based on `props.allocationContext?.source_amount`
- [x] Add compact buttons under amount field (25/50/100)
- [x] Implement handler to set `form.amount` and `amountDisplay` using `formatNumberInput`
- [x] Disable buttons when referenceAmount is 0
- [x] Manual verification: amount updates correctly and quantity calculation remains correct

**Primary Files:**
- `components/HoldingDialog.vue`
- `components/AllocationsHistory.vue` (reference amount source, verify remains correct)

**Status:** Done

---

### 3) Currency Input UX - Backspace/Delete “Jumping Digits” Bug

**Goal:** Keep thousand separators for UX while making typing/backspace stable and predictable.

**Observed Pattern:** Inputs use `v-model` for display + `@input` formatting which can cause caret to jump.

**Implementation Direction (Best-Practice, minimal complexity):**
- Preserve caret position when re-formatting display values during input.
- Prefer a small reusable helper that:
  - reads caret position
  - formats value
  - restores caret via `setSelectionRange()` after DOM update

**Implementation Detail:**
- Caret-aware formatting is implemented via `formatNumberInputWithCaret(value, caretPosition)`.

**Planned Changes:**
- [x] Identify affected fields/components (amount inputs that format on each `@input`)
- [x] Implement minimal caret-preserving formatting helper (reusable)
- [x] Apply helper to:
  - [x] HoldingDialog amount
  - [x] HoldingDialog average price
  - [x] AllocationDialog source amount
- [x] Manual verification scenarios:
  - [x] Backspace at end
  - [x] Backspace in middle
  - [x] Boundary near separators

**Primary Files:**
- `utils/format.ts`
- `components/HoldingDialog.vue`
- `components/AllocationDialog.vue`
- `components/TransactionEditDialog.vue`
- `components/SimulateDialog.vue`

**Status:** Done

---

### 5) API Amount Contract (Normalization)

**Goal:** Ensure API returns monetary fields as integer rupiah numbers to avoid FE having to support DB string numeric formats.

**Rationale:**
- DB drivers often return `NUMERIC` as string (e.g., "3000200.00").
- FE then has to implement heuristics to parse both user input (ID locale) and DB formats, which increases complexity and can cause cursor-jump edge cases.

**Planned Changes:**
- [x] Normalize `GET /api/allocations` monetary fields to integer (cast to `bigint` in SQL):
  - [x] `source_amount`
  - [x] `allocation_items[].amount`
  - [x] `total_allocated`
- [x] Normalize `POST /api/allocations` response monetary fields to integer (cast to `bigint` in SQL):
  - [x] `source_amount`
  - [x] `allocation_items[].amount`
- [x] Extend normalization to other endpoints that return monetary fields (holdings, holding transactions):
  - [x] `GET /api/holdings` (`total_investment`)
  - [x] `POST /api/holdings` response (`total_investment`)
  - [x] `GET /api/holdings/:id/transactions` (`amount`, `average_price`, `allocation_source_amount`)
  - [x] `GET /api/allocations/:id/transactions` (`amount`, `average_price`)
  - [x] `PATCH /api/holdings/:id` response (`total_investment`)
  - [x] `PATCH /api/holdings/transactions/:id` response (`amount`, `average_price`) and aggregates (`total_investment`)
- [x] Manual verification: FE network responses no longer contain monetary fields as strings with decimals.

**Primary Files:**
- `server/api/allocations.get.ts`

**Status:** Done

### 4) Allocation Remaining Amount Bug (Incorrect Remaining)

**Goal:** Ensure remaining amount on allocation card is correct: `remaining = source_amount - total_allocated`.

**Likely Root Cause:** Aggregation query duplicates `holding_transactions` rows due to joining `allocation_items` and `holding_transactions` in the same query, causing `SUM(ht.amount)` to be overcounted.

**Planned Changes:**
- [x] Update `server/api/allocations.get.ts` query to avoid join multiplication
  - [x] Aggregate `holding_transactions` per allocation_id in a subquery and join the aggregated result
  - [x] Keep `allocation_items` aggregation intact
- [x] Manual verification:
  - [x] Allocation source_amount = 15,000,000
  - [x] One holding transaction linked_allocation_id with amount = 2,000,000
  - [x] total_allocated returns 2,000,000
  - [x] remaining returns 13,000,000

**Primary Files:**
- `server/api/allocations.get.ts`
- `components/AllocationsHistory.vue` (uses `total_allocated` to compute remaining)

**Status:** Done (query fix implemented)

**Implementation Notes:**
- `total_allocated` is now computed from an aggregated subquery (`holding_transactions` grouped by `linked_allocation_id`) and joined as `ht_summary`.
- This prevents `SUM(ht.amount)` from being overcounted due to join multiplication with `allocation_items`.

---

## Notes / Decisions

- **Pocket toggle approach:** Option A (dialog-only) was chosen to avoid schema changes and keep behavior per-allocation.
- **Reference amount for extract buttons:** Use `allocationContext.source_amount` which is already set to remaining amount in `AllocationsHistory`.
