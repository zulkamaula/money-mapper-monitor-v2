export const useAllocationNavigation = () => {
  const targetAllocationId = useState<string | null>('targetAllocationId', () => null)

  function navigateToAllocation(allocationId: string) {
    targetAllocationId.value = allocationId
  }

  function clearTarget() {
    targetAllocationId.value = null
  }

  return {
    targetAllocationId,
    navigateToAllocation,
    clearTarget
  }
}
