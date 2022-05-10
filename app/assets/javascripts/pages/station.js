'use strict'
import 'elm-pep'
import '../core'
import '../components/line-chart'
import '../components/toggle-list-display'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/style'
import '../components/map/container'
import '../components/map/live'
import '../components/tooltip'
import '../components/toggletip'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'Map',
    btnClasses: 'defra-link-icon-s',
    layers: 'mv,ri,ti,gr',
    centre: window.flood.model.centroid,
    zoom: 14,
    selectedId: `stations.${window.flood.model.rloiId}`
  })
}

// Add toggletips
if (document.querySelectorAll('.defra-toggletip')) {
  window.flood.createToggletips()
}

// Line chart
if (document.querySelector('.defra-line-chart')) {
  const lineChart = window.flood.charts.createLineChart('line-chart', window.flood.model.id, window.flood.model.telemetry)
  const thresholdId = `threshold-${window.flood.model.id}-high`
  const threshold = document.querySelector(`[data-id="${thresholdId}"]`)
  if (threshold) {
    lineChart.addThreshold({
      id: thresholdId,
      name: threshold.getAttribute('data-name'),
      level: Number(threshold.getAttribute('data-level'))
    })
  }
}
