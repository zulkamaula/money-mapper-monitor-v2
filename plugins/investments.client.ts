export default defineNuxtPlugin(() => {
  const { selectedBook } = useMoneyBooks()
  const { holdings, simulationResult, loadInvestments } = useInvestments()

  // Single global watcher for reactive investment data loading
  // Why watch?: Reactive to selectedBook changes, auto-cleanup, no memory leaks
  // Alternative approaches evaluated:
  // ❌ onMounted: Doesn't react to book changes after mount
  // ❌ Manual calls: Risk of forgetting to call, no reactivity
  // ✅ watch: Auto-reacts to state changes, built-in cleanup, Vue 3 best practice
  
  // Race condition handling:
  // ✅ AbortController in loadInvestments() cancels previous requests
  // ✅ Clear state immediately before loading prevents UI flash
  // ✅ Single watcher (plugin) prevents duplicate API calls
  
  watch(() => selectedBook.value?.id, (newBookId, oldBookId) => {
    // Clear stale data immediately (prevents flash)
    if (newBookId !== oldBookId) {
      holdings.value = []
      simulationResult.value = null
    }
    
    if (newBookId) {
      loadInvestments(newBookId)
    }
  }, { immediate: true })
})
