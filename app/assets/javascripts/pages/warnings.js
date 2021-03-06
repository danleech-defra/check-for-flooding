'use strict'
import 'elm-pep'
import '../core'
import '../components/filter'
import '../build/templates'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Create LiveMap
if (document.getElementById('map-live')) {
  window.flood.maps.createLiveMap('map-live', {
    btnText: 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ts,tw,ta',
    extent: window.flood.model.bbox
  })
}
