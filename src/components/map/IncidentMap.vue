<template>
  <div class="map-wrapper">
    <div id="map" class="map-component"></div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps(['reports', 'filter'])
let map = null
let markerLayers = []

onMounted(() => {
  map = L.map('map').setView([16.6917, 121.6567], 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)
})

watch(
  [() => props.filter, () => props.reports],
  () => {
    if (!map) return

    markerLayers.forEach((layer) => map.removeLayer(layer))
    markerLayers = []

    props.reports.forEach((r) => {
      if (props.filter === 'all' || r.statusLabel === props.filter) {
        // Color Logic
        let color = '#ef4444' // Red (Default)
        if (r.statusLabel === 'RESOLVED') color = '#22c55e'
        if (r.statusLabel === 'IN PROGRESS') color = '#3b82f6' // Light Blue
        if (r.statusLabel === 'PENDING') color = '#eab308' // Yellow

        const marker = L.circleMarker([r.latitude, r.longitude], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          fillOpacity: 0.8,
        })
          .addTo(map)
          .bindPopup(`<strong>${r.landmark}</strong><br/>Status: ${r.statusLabel}`)

        markerLayers.push(marker)
      }
    })
  },
  { immediate: true },
)
</script>

<style scoped>
.map-wrapper,
#map {
  width: 100%;
  height: 100%;
}
</style>
