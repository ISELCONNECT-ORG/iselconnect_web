<!-- src/components/map/IncidentMap.vue -->
<template>
  <div class="map-wrapper">
    <div id="map" class="map-component"></div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  reports: {
    type: Array,
    default: () => [],
  },
  filter: {
    type: String,
    default: 'all',
  },
  mapMode: {
    type: String,
    default: 'markers', // 'markers' or 'heatmap'
  },
  focusedReport: {
    type: Object,
    default: null,
  },
})

let map = null
let markersById = {} // Store marker references by Report ID
let heatLayer = null

const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN

// Dynamically load the leaflet-heat script from cdnjs to avoid Unpkg tracking prevention blocks
const loadHeatmapScript = () => {
  return new Promise((resolve, reject) => {
    if (window.L && window.L.heatLayer) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

onMounted(() => {
  map = L.map('map').setView([16.716173, 121.678825], 13) // Centered over Echague

  // Use LocationIQ tiles for reliable loading, fallback to OSM
  if (LOCATIONIQ_TOKEN) {
    L.tileLayer(
      `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${LOCATIONIQ_TOKEN}`,
      {
        maxZoom: 19,
        attribution: '© LocationIQ, OpenStreetMap contributors',
      },
    ).addTo(map)
  } else {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)
  }

  // Force map to recalculate its size after rendering to prevent gray tiles
  setTimeout(() => {
    if (map) map.invalidateSize()
  }, 250)
})

watch(
  [() => props.filter, () => props.reports, () => props.mapMode],
  async () => {
    if (!map) return

    // Clean up existing markers
    Object.values(markersById).forEach((layer) => map.removeLayer(layer))
    markersById = {}

    // Clean up existing heatmap
    if (heatLayer) {
      map.removeLayer(heatLayer)
      heatLayer = null
    }

    const filteredReports = props.reports.filter((r) => {
      return props.filter === 'all' || r.statusLabel === props.filter
    })

    if (props.mapMode === 'heatmap') {
      // --- GEOGRAPHICAL DENSITY HEATMAP MODE ---
      try {
        await loadHeatmapScript()

        // Map reports to coordinate array with a base intensity of 1
        const heatPoints = filteredReports
          .filter((r) => r.latitude && r.longitude) // Ensure valid coordinates exist
          .map((r) => [parseFloat(r.latitude), parseFloat(r.longitude), 1.0])

        // Configure HeatLayer for Density (Red = High Concentration of Reports)
        heatLayer = L.heatLayer(heatPoints, {
          radius: 35, // Size of each point's spread
          blur: 25, // Smooths the colors together to create zones
          maxZoom: 14, // Zoom level where points reach maximum intensity naturally
          max: 4, // Threshold for maximum heat (e.g., 4 overlapping reports = RED)
          gradient: {
            0.2: 'blue', // Sparse / Single reports
            0.4: 'cyan',
            0.6: 'lime', // Medium density
            0.8: 'yellow',
            1.0: 'red', // High density / Too many reports
          },
        }).addTo(map)
      } catch (error) {
        console.error('Failed to load Heatmap plugin:', error)
      }
    } else {
      // --- PRIORITY-BASED MARKERS MODE ---
      filteredReports.forEach((r) => {
        if (!r.latitude || !r.longitude) return

        // Priority colors mapping
        let color = '#3b82f6' // Default Normal (Blue)
        const priority = r.priorityLevel ? r.priorityLevel.toLowerCase() : 'normal'

        if (priority === 'low') color = '#eab308' // Yellow
        if (priority === 'high') color = '#f97316' // Orange
        if (priority === 'critical') color = '#ef4444' // Red

        const marker = L.circleMarker([parseFloat(r.latitude), parseFloat(r.longitude)], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(map).bindPopup(`
            <strong>${r.landmark || 'Incident Location'}</strong><br/>
            Priority: ${r.priorityLevel || 'Normal'}<br/>
            Status: ${r.statusLabel}
          `)

        markersById[r.id] = marker // Map the ID to the marker
      })
    }
  },
  { immediate: true, deep: true },
)

// --- Watch for click events on the Sidebar to trigger map flyTo ---
watch(
  () => props.focusedReport,
  (newReport) => {
    if (!map || !newReport || !newReport.latitude || !newReport.longitude) return

    const lat = parseFloat(newReport.latitude)
    const lng = parseFloat(newReport.longitude)

    // Smoothly fly to the incident location and zoom in
    map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 })

    // Open popup after map arrives (only works if we are in markers mode)
    if (props.mapMode === 'markers' && markersById[newReport.id]) {
      setTimeout(() => {
        markersById[newReport.id].openPopup()
      }, 300)
    }
  },
  { deep: true },
)
</script>

<style scoped>
.map-wrapper,
.map-component,
#map {
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
