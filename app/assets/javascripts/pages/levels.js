'use strict'
import 'elm-pep'
import '../core'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/style'
import '../components/map/container'
import '../components/map/live'
import '../components/tooltip'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map of levels',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model.bbox
  })
}

// Add tool tips
const tooltips = document.querySelectorAll('[data-tooltip]')
if (tooltips) {
  window.flood.createTooltips()
}
