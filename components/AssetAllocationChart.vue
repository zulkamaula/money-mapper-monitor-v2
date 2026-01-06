<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const props = defineProps<{
  data: Record<string, { name: string; value: number }>
}>()

const chartContainer = ref<HTMLDivElement | null>(null)
const chartInstance = ref<any>(null)

const assetColors: Record<string, string> = {
  gold: '#FFD700',
  stock_etf: '#4CAF50',
  mutual_fund: '#2196F3',
  bond: '#FF9800',
  crypto: '#9C27B0',
  other: '#607D8B'
}

const chartData = computed(() => {
  const entries = Object.entries(props.data)
  if (entries.length === 0) return null
  
  return entries.map(([type, info]) => ({
    label: info.name,
    value: info.value,
    color: assetColors[type] || '#607D8B',
    percentage: 0 // Will be calculated
  }))
})

const totalValue = computed(() => {
  if (!chartData.value) return 0
  return chartData.value.reduce((sum, item) => sum + item.value, 0)
})

// Calculate percentages
const chartDataWithPercentages = computed(() => {
  if (!chartData.value || totalValue.value === 0) return []
  return chartData.value.map(item => ({
    ...item,
    percentage: (item.value / totalValue.value) * 100
  }))
})

// Simple canvas-based donut chart
function drawChart() {
  if (!chartContainer.value || !chartDataWithPercentages.value.length) return
  
  const canvas = chartContainer.value.querySelector('canvas') as HTMLCanvasElement
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) - 10
  const innerRadius = radius * 0.6
  
  let currentAngle = -Math.PI / 2
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  chartDataWithPercentages.value.forEach(item => {
    const sliceAngle = (item.percentage / 100) * 2 * Math.PI
    
    // Draw slice
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()
    
    currentAngle += sliceAngle
  })
  
  // Draw center circle (white)
  ctx.beginPath()
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
}

onMounted(() => {
  nextTick(() => {
    drawChart()
  })
})

watch(() => props.data, () => {
  nextTick(() => {
    drawChart()
  })
}, { deep: true })
</script>

<template>
  <div class="asset-allocation-chart">
    <div v-if="chartDataWithPercentages.length === 0" class="empty-state text-center pa-4">
      <VIcon icon="mdi-chart-donut" size="48" color="grey-lighten-1" />
      <p class="text-caption text-medium-emphasis mt-2">No data to display</p>
    </div>
    
    <div v-else class="chart-wrapper">
      <!-- Canvas Chart -->
      <div ref="chartContainer" class="chart-canvas">
        <canvas width="200" height="200"></canvas>
      </div>
      
      <!-- Legend -->
      <div class="chart-legend">
        <div
          v-for="item in chartDataWithPercentages"
          :key="item.label"
          class="legend-item"
        >
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <div class="legend-text">
            <span class="legend-label text-caption">{{ item.label }}</span>
            <span class="legend-value text-caption font-weight-bold">
              {{ item.percentage.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.asset-allocation-chart {
  width: 100%;
}

.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.chart-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-canvas canvas {
  max-width: 100%;
  height: auto;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 300px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.02);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 8px;
}

.legend-label {
  color: rgba(0, 0, 0, 0.7);
}

.legend-value {
  color: rgba(0, 0, 0, 0.87);
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
