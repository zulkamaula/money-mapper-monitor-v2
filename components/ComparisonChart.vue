<script setup lang="ts">
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'

const props = defineProps<{
  initialInvestment: number
  currentValue: number
}>()

const chartContainer = ref<HTMLDivElement>()
const chartInstance = ref<uPlot>()

function createChart() {
  if (!chartContainer.value) return

  const data: uPlot.AlignedData = [
    [0, 1], // x-axis: 0 = Initial, 1 = Current
    [props.initialInvestment, props.initialInvestment], // Initial Investment (flat line)
    [props.initialInvestment, props.currentValue] // Current Value
  ] as uPlot.AlignedData

  const opts: uPlot.Options = {
    width: chartContainer.value.offsetWidth,
    height: 300,
    scales: {
      x: {
        time: false
      },
      y: {
        auto: true
      }
    },
    axes: [
      {
        label: '',
        values: ['Initial', 'Current'],
        grid: { show: false }
      },
      {
        label: 'Value (Rp)',
        values: (u, vals) => vals.map(v => {
          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
          if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
          return v.toFixed(0)
        }),
        grid: { show: true }
      }
    ],
    series: [
      {},
      {
        label: 'Initial Investment',
        stroke: '#0F766E', // primary color
        width: 3,
        points: { show: true, size: 8 },
        dash: [5, 5]
      },
      {
        label: 'Current Value',
        stroke: props.currentValue >= props.initialInvestment ? '#10B981' : '#EF4444', // green/red
        width: 3,
        points: { show: true, size: 8 }
      }
    ],
    legend: {
      show: true,
      live: false
    }
  }

  // Destroy existing chart
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  chartInstance.value = new uPlot(opts, data, chartContainer.value)
}

// Handle resize
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  createChart()

  // Setup resize observer
  if (chartContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (chartInstance.value && chartContainer.value) {
        chartInstance.value.setSize({
          width: chartContainer.value.offsetWidth,
          height: 300
        })
      }
    })
    resizeObserver.observe(chartContainer.value)
  }
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// Recreate chart when data changes
watch(() => [props.initialInvestment, props.currentValue], () => {
  createChart()
}, { deep: true })
</script>

<template>
  <div class="comparison-chart">
    <div ref="chartContainer" class="chart-container" />
  </div>
</template>

<style scoped>
.comparison-chart {
  width: 100%;
  margin: 0 auto;
}

.chart-container {
  width: 100%;
  height: 300px;
}

:deep(.u-legend) {
  text-align: center;
  font-size: 12px;
  margin-top: 8px;
}

:deep(.u-series:nth-child(1) th) {
  display: none;
}
</style>
