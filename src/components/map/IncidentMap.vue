<template>
  <div class="map-wrapper">
    <div id="map-exclusive-container" class="map-component"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '@/services/supabase'

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

let map = null

const initMap = () => {
  const container = document.getElementById('map-exclusive-container')
  if (!container) return

  // Initialize with optimized settings for stability and control
  map = L.map('map-exclusive-container', {
    fadeAnimation: false,
    zoomAnimation: false,
    markerZoomAnimation: false,
    zoomSnap: 0.25, // Granular zooming
    zoomDelta: 0.5, // Smaller steps
    wheelPxPerZoomLevel: 150, // Reduced sensitivity
  }).setView([16.6917, 121.6567], 16)

  // High-resolution satellite texture
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles &copy; Esri',
    },
  ).addTo(map)

  setTimeout(() => map.invalidateSize(), 300)
  fetchAndPlot()
}

const fetchAndPlot = async () => {
  if (!map) return

  const { data: reports } = await supabase
    .from('reports')
    .select('id, landmark, latitude, longitude, status_id')

  reports?.forEach((r) => {
    if (r.latitude && r.longitude) {
      // Map IDs to human-readable labels and colors
      let color = '#ef4444' // Default Red (Pending)
      let label = 'Pending'

      if (r.status_id === 3) {
        color = '#3b82f6' // Blue
        label = 'Resolved'
      } else if (r.status_id === 2) {
        color = '#f59e0b' // Orange
        label = 'Assigned'
      }

      L.circleMarker([r.latitude, r.longitude], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
      })
        .addTo(map)
        .bindPopup(`<b>${r.landmark || 'Location'}</b><br>Status: <b>${label}</b>`)
    }
  })
}

onMounted(() => requestAnimationFrame(initMap))

onBeforeUnmount(() => {
  if (map) {
    map.stop()
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
.map-component {
  width: 100%;
  height: 100%;
}
</style>
