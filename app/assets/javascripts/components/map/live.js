'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer
import mapSymbols from './map-symbols.png'
import { LngLatBounds, LngLat } from 'maplibre-gl'

const { addOrUpdateParameter, getParameterByName, forEach, xhr } = window.flood.utils
const maps = window.flood.maps
const MapContainer = maps.MapContainer

function LiveMap (mapId, options) {
  //
  // Private methods
  //

  // Compare two lonLat extent arrays and return true if they are 'considered' different
  const isNewExtent = (newExt) => {
    // Check either lons or lats are the same
    const isSameLon1 = newExt[0] < (state.initialExt[0] + 0.0001) && newExt[0] > (state.initialExt[0] - 0.0001)
    const isSameLon2 = newExt[2] < (state.initialExt[2] + 0.0001) && newExt[2] > (state.initialExt[2] - 0.0001)
    const isSameLat1 = newExt[1] < (state.initialExt[1] + 0.0001) && newExt[1] > (state.initialExt[1] - 0.0001)
    const isSameLat2 = newExt[3] < (state.initialExt[3] + 0.0001) && newExt[3] > (state.initialExt[3] - 0.0001)
    const isSameWidth = isSameLon1 && isSameLon2
    const isSameHeight = isSameLat1 && isSameLat2
    // Check origianl extent is contained within the new extent
    const newBounds = new LngLatBounds(
      new LngLat(newExt[0], newExt[1]),
      new LngLat(newExt[2], newExt[3])
    )
    const initialSW = new LngLat(state.initialExt[0], state.initialExt[1])
    const initialNE = new LngLat(state.initialExt[2], state.initialExt[3])
    const isInititalWithinNew = newBounds.contains(initialSW) && newBounds.contains(initialNE)
    return !((isSameWidth || isSameHeight) && isInititalWithinNew)
  }

  // Add target areas to corresponsing warning layers
  const addWarnings = (geojson) => {
    // Add point data here to save on requests
    map.getSource('warnings').setData(geojson)
    state.warnings = geojson.features.filter(f => f.properties.state !== 'removed')
    setFeatureVisibility()
  }

  // Set feature state for target area polygons
  const setTargetAreaState = () => {
    const features = map.queryRenderedFeatures(null, { layers: ['target-areas'], validate: false })
    features.forEach(f => {
      const warning = state.warnings.find(w => w.properties.id === f.id)
      map.setFeatureState(
        { source: 'polygons', sourceLayer: 'targetareas', id: f.properties.id },
        { state: warning.properties.state }
      )
    })
  }

  // Show or hide layers or features within layers
  const setFeatureVisibility = () => {
    // Get layers from querystring
    if (getParameterByName('lyr')) {
      state.layers = getParameterByName('lyr').split(',')
      // Set key input states
      const inputs = document.querySelectorAll('.defra-map-key input')
      forEach(inputs, (input) => { input.checked = state.layers.includes(input.id) })
    }
    // Toggle base layer group
    baseLayers.forEach(layer => {
      map.setLayoutProperty(layer.id, 'visibility', state.layers.includes('mv') ? 'visible' : 'none')
    })
    // Apply base layer custom properties
    map.setLayoutProperty('country names', 'visibility', 'none')
    // Toggle aerial layer
    map.setLayoutProperty('aerial', 'visibility', state.layers.includes('sv') ? 'visible' : 'none')
    const types = Object.keys(layersConfig).filter(k => state.layers.includes(layersConfig[k]))
    // Conditionally hide selected feature
    if (state.selectedFeature) {
      const properties = state.selectedFeature.properties
      const type = properties.type === 'targetarea' ? properties.state : properties.type
      if (!types.includes(type)) toggleSelectedFeature(null)
    }
    // Filter warning points and stations
    map.setFilter('warnings', ['all', ['match', ['get', 'state'], types.length ? types : '', true, false], ['<', ['zoom'], 10]])
    map.setFilter('stations', ['match', ['get', 'type'], types.length ? types : '', true, false])
    // Filter target areas
    const warnings = state.warnings.filter(w => state.layers.includes(layersConfig[w.properties.state])).map(f => f.properties.id)
    map.setFilter('target-areas', ['match', ['get', 'id'], warnings.length ? warnings : '', true, false])
  }

  // Set selected feature
  const toggleSelectedFeature = (feature) => {
    if (feature) {
      state.selectedFeature = feature
      feature.properties.selected = '-selected'
      map.getSource('selected').setData({ type: 'FeatureCollection', features: [feature] })
      map.setLayoutProperty('selected', 'icon-image', map.getLayoutProperty(feature.layer.id, 'icon-image'), { validate: false })
      map.setFilter('selected', map.getFilter(feature.layer.id))
      map.setFilter('target-areas-selected', ['in', 'id', feature.properties.id])
    } else {
      state.selectedFeature = null
      map.getSource('selected').setData({ type: 'FeatureCollection', features: [] })
      map.setFilter('target-areas-selected', ['in', 'id', ''])
    }

    // console.log(e.point)
    // map.setFeatureState(
    //   {
    //     source: feature.source,
    //     id: feature.id
    //   },
    //   {
    //     isSelected: true
    //   }
    // )
    // console.log(e.features[0])
    // replaceHistory('fid', newFeatureId)
  }

  // Toggle key symbols based on resolution
  const toggleKeySymbol = () => {
    forEach(containerElement.querySelectorAll('.defra-map-key__symbol[data-display="toggle-image"]'), (symbol) => {
      // const isBigZoom = map.getView().getResolution() <= maps.liveMaxBigZoom
      const isBigZoom = true
      if (isBigZoom) {
        symbol.classList.add('defra-map-key__symbol--big')
        symbol.classList.remove('defra-map-key__symbol--small')
      } else {
        symbol.classList.add('defra-map-key__symbol--small')
        symbol.classList.remove('defra-map-key__symbol--big')
      }
    })
  }

  // Update url and replace history state
  const replaceHistory = (key, value) => {
    const data = { v: mapId, isBack: options.isBack, initialExt: state.initialExt }
    const uri = addOrUpdateParameter(window.location.href, key, value)
    const title = document.title
    window.history.replaceState(data, title, uri)
  }

  // Generate feature name
  const featureName = (feature) => {
    // let name = ''
    // if (feature.get('type') === 'C') {
    //   name = `Tide level: ${feature.get('name')}`
    // } else if (feature.get('type') === 'S' || feature.get('type') === 'M') {
    //   name = `River level: ${feature.get('name')}, ${feature.get('river')}`
    // } else if (feature.get('type') === 'G') {
    //   name = `Groundwater level: ${feature.get('name')}`
    // } else if (feature.getId().startsWith('rainfall_stations')) {
    //   name = `Rainfall: ${feature.get('station_name')}`
    // } else if (feature.get('severity_value') === 3) {
    //   name = `Severe flood warning: ${feature.get('ta_name')}`
    // } else if (feature.get('severity_value') === 2) {
    //   name = `Flood warning: ${feature.get('ta_name')}`
    // } else if (feature.get('severity_value') === 1) {
    //   name = `Flood alert: ${feature.get('ta_name')}`
    // }
    // return name
  }

  // Get features visible in the current viewport
  const getVisibleFeatures = () => {
    // const features = []
    // const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    // const resolution = map.getView().getResolution()
    // const extent = map.getView().calculateExtent(map.getSize())
    // const isBigZoom = resolution <= maps.liveMaxBigZoom
    // const layers = dataLayers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    // if (!layers.includes(warnings) && targetArea.pointFeature) {
    //   layers.push(warnings)
    // }
    // layers.forEach((layer) => {
    //   layer.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
    //     if (layer.get('ref') === 'warnings' && !feature.get('isVisible')) { return false }
    //     features.push({
    //       id: feature.getId(),
    //       name: featureName(feature),
    //       state: layer.get('ref'), // Used to style the overlay
    //       isBigZoom: isBigZoom,
    //       centre: feature.getGeometry().getCoordinates()
    //     })
    //   })
    // })
    // return features
  }

  // Show overlays
  const showOverlays = () => {
    // state.visibleFeatures = getVisibleFeatures()
    // const numFeatures = state.visibleFeatures.length
    // const numWarnings = state.visibleFeatures.filter((feature) => feature.state === 'warnings').length
    // const mumMeasurements = numFeatures - numWarnings
    // const features = state.visibleFeatures.slice(0, 9)
    // // Show visual overlays
    // hideOverlays()
    // if (maps.isKeyboard && numFeatures >= 1 && numFeatures <= 9) {
    //   state.hasOverlays = true
    //   features.forEach((feature, i) => {
    //     const overlayElement = document.createElement('span')
    //     overlayElement.setAttribute('aria-hidden', true)
    //     overlayElement.innerText = i + 1
    //     const selected = feature.id === state.selectedFeatureId ? 'defra-key-symbol--selected' : ''
    //     map.addOverlay(
    //       new Overlay({
    //         id: feature.id,
    //         element: overlayElement,
    //         position: feature.centre,
    //         className: `defra-key-symbol defra-key-symbol--${feature.state}${feature.isBigZoom ? '-bigZoom' : ''} ${selected}`,
    //         offset: [0, 0]
    //       })
    //     )
    //   })
    // }
    // // Show non-visual feature details
    // const model = {
    //   numFeatures: numFeatures,
    //   numWarnings: numWarnings,
    //   mumMeasurements: mumMeasurements,
    //   features: features
    // }
    // const html = window.nunjucks.render('description-live.html', { model: model })
    // viewportDescription.innerHTML = html
  }

  // Hide overlays
  const hideOverlays = () => {
    // state.hasOverlays = false
    // map.getOverlays().clear()
  }

  // Set target area polygon opacity
  const setFillOpacity = (layers) => {
    const settings = ['interpolate', ['exponential', 0.5], ['zoom'], 10, 1, 16, 0.3]
    layers.forEach(layer => { map.setPaintProperty(layer, 'fill-opacity', settings) })
  }

  // Pan map
  const panToFeature = (feature) => {
    // let extent = map.getView().calculateExtent(map.getSize())
    // extent = buffer(extent, -1000)
    // if (!containsExtent(extent, feature.getGeometry().getExtent())) {
    //   map.getView().setCenter(feature.getGeometry().getCoordinates())
    // }
  }

  // Time format function
  const formatTime = (date) => {
    const hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
    const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
    const amPm = (date.getHours() > 12) ? 'pm' : 'am'
    return hours + ':' + minutes + amPm
  }

  // Day format function
  const formatDay = (date) => {
    const day = date.getDate()
    const nth = (day) => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th' }
    }
    const shortDay = date.toLocaleString('en-GB', { weekday: 'short' })
    const today = new Date()
    const yesterday = new Date()
    const tomorrow = new Date()
    today.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    if (date.getTime() === today.getTime()) {
      return 'today'
    } else if (date.getTime() === yesterday.getTime()) {
      return 'yesterday'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'tomorrow'
    } else {
      return ' on ' + shortDay + ' ' + date.getDate() + nth(day)
    }
  }

  // Format expired time
  const formatExpiredTime = (date) => {
    const duration = (new Date() - new Date(date)) // milliseconds between now & Christmas
    const mins = Math.floor(duration / (1000 * 60)) // minutes
    const hours = Math.floor(duration / (1000 * 60 * 60)) // hours
    const days = parseInt(Math.floor(hours / 24)) // days
    return (mins < 91 ? mins + ' minutes' : (hours < 48 ? hours + ' hours' : days + ' days')) + ' ago'
  }

  // Capitalise string
  // const capitalise = (str) => {
  //   return str.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
  // }

  // Set feature overlay html
  const setFeatureHtml = (feature) => {
    // const model = feature.getProperties()
    // model.id = feature.getId().substring(feature.getId().indexOf('.') + 1)
    // // Format dates for river levels
    // if (feature.getId().startsWith('stations')) {
    //   model.date = formatExpiredTime(model.valueDate)
    // } else if (model.issuedDate) {
    //   model.date = `${formatTime(new Date(model.issuedDate))} ${formatDay(new Date(model.issuedDate))}`
    // }
    // const html = window.nunjucks.render('info-live.html', { model: model })
    // feature.set('html', html)
  }

  // Show reset button if extent has changed
  const toggleReset = () => {
    const ext = maps.getExtentFromBounds(map.getBounds())
    if (isNewExtent(ext)) {
      resetButton.removeAttribute('disabled')
    }
  }

  // We need to wait for style data to load before adding sources and layers
  const initMap = () => {
    // Get a reference to background layers
    baseLayers = map.getStyle().layers
    map.moveLayer('buildings 2D', 'surfacewater shadow')
    map.moveLayer('buildings 3D', 'surfacewater shadow')
    // Add sources
    map.addSource('aerial', maps.style.source.aerial)
    map.addSource('polygons', maps.style.source.polygons)
    map.addSource('warnings', maps.style.source.warnings)
    map.addSource('stations', maps.style.source.stations)
    map.addSource('selected', maps.style.source.selected)
    // Add layers
    map.addLayer(maps.style.aerial, baseLayers[0].id)
    // Target areas
    map.addLayer(maps.style['target-areas'], 'surfacewater shadow')
    map.addLayer(maps.style['target-areas-selected'], 'road numbers')
    // Points
    map.addLayer(maps.style.stations)
    map.addLayer(maps.style.warnings)
    map.addLayer(maps.style.selected)
    // Add warnings data here so that we have access features outside viewport
    loadGeoJson(`${window.location.origin}/service/geojson/warnings`, addWarnings)
    // Set polygon opacity
    setFillOpacity(['target-areas'])
  }

  // A helper method to load geojson at runtime
  const loadGeoJson = (uri, callback) => {
    xhr(uri, (err, response) => {
      if (err) {
        console.log('Error: ' + err)
      } else {
        callback(response)
      }
    }, 'json')
  }

  //
  // Setup
  //

  // Set maxBigZoom value
  maps.liveMaxBigZoom = 100

  // Optional target area features
  const targetArea = null

  // COnst layers config
  const layersConfig = { default: 'mv', aerial: 'ms', severe: 'ts', warning: 'tw', alert: 'ta', removed: 'tr', river: 'ri', sea: 'se', groundwater: 'gr', rain: 'rf' }

  // State object
  const state = {
    warnings: [],
    visibleFeatures: [],
    selectedFeature: '',
    initialExt: [],
    layers: []
  }

  // Layers
  let baseLayers
  const featureLayers = ['target-areas', 'stations', 'warnings']

  // View
  // const view = new View({
  //   zoom: 6, // Default zoom
  //   minZoom: 6, // Minimum zoom level
  //   maxZoom: 18,
  //   center: maps.centre, // Default centre required
  //   extent: maps.extent // Constrains extent
  // })

  // Configure default interactions
  // const interactions = defaultInteractions({
  //   pinchRotate: false
  // })

  // Define bounds
  let ext = getParameterByName('ext')
  if (ext) {
    ext = maps.cleanExtent(ext.split(','))
  } else if (options.extent && options.extent.length) {
    ext = maps.cleanExtent(options.extent)
  } else {
    ext = maps.extent
  }

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    maxBigZoom: maps.liveMaxBigZoom,
    bounds: ext,
    // centre: maps.centre,
    // zoom: 6,
    // layers: layers,
    queryParamKeys: ['v', 'lyr', 'ext', 'fid'],
    originalTitle: options.originalTitle,
    title: options.title,
    heading: options.heading,
    keyTemplate: 'key-live.html',
    isBack: options.isBack
  }

  // Create MapContainer
  const container = new MapContainer(mapId, containerOptions)
  const map = container.map
  const containerElement = container.containerElement
  const viewport = container.viewport
  const viewportDescription = container.viewportDescription
  const keyElement = container.keyElement
  const resetButton = container.resetButton
  const closeInfoButton = container.closeInfoButton
  const openKeyButton = container.openKeyButton

  // Store extent for use with reset button
  state.initialExt = window.history.state.initialExt || maps.getExtentFromBounds(map.getBounds())

  toggleKeySymbol()

  // Set initial selected feature id
  // if (getParameterByName('fid')) {
  //   state.selectedFeatureId = decodeURI(getParameterByName('fid'))
  // }

  // Create optional target area feature
  // if (options.targetArea) {
  //   targetArea.pointFeature = new Feature({
  //     geometry: new Point(transform(options.targetArea.centre, 'EPSG:4326', 'EPSG:3857')),
  //     name: options.targetArea.name,
  //     ta_code: options.targetArea.id,
  //     type: 'TA'
  //   })
  //   targetArea.pointFeature.setId(options.targetArea.id)
  // }

  // Set map viewport
  // if (!getParameterByName('ext') && options.centre) {
  //   map.getView().setCenter(transform(options.centre, 'EPSG:4326', 'EPSG:3857'))
  //   map.getView().setZoom(options.zoom || 6)
  // } else {
  //   setExtentFromLonLat(map, extent)
  // }

  // map.addSource('background', {
  //   type: 'vector',
  //   tiles: ['https://s3-eu-west-1.amazonaws.com/tiles.os.uk/v2/styles/open-zoomstack-outdoor/style.json'],
  //   minzoom: 6,
  //   maxzoom: 14
  // })

  // Object.keys(maps.symbols).forEach(key => {
  //   map.loadImage(maps.symbols[key], (error, image) => {
  //     if (error) throw error
  //     map.addImage(key, image)
  //   })
  // })
  // map.loadImage('/public/images/map-symbols-2x.png', (error, image) => {
  //   if (error) throw error
  //   forEach( => {
  //   map.addImage('markers', image)
  //   })
  //   map.addSource('river-levels', maps.style.source['river-levels'])
  //   map.addLayer(maps.style['river-levels'])
  // })

  // xhr(`${window.location.origin}/service/geojson/stations`, (err, response) => {
  //   if (err) {
  //     console.log('Error: ' + err)
  //   } else {
  //     stationData = response
  //     initMap()
  //   }
  // }, 'json')

  //
  // Events
  //

  // We need to wait for style data and icons to load before we can initialise the map
  map.once('styledata', () => {
    // Create multiple images from one sprite file
    const images = []
    map.loadImage(mapSymbols, (error, sprite) => {
      Object.keys(maps.symbols).forEach(key => {
        const pos = maps.symbols[key]
        if (error) throw error
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        context.canvas.width = pos.size
        context.canvas.height = pos.size
        context.drawImage(sprite, pos.left, pos.top, pos.size, pos.size, 0, 0, pos.size, pos.size)
        const symbol = canvas.toDataURL('img/png')
        map.loadImage(symbol, (error, image) => {
          if (error) throw error
          map.addImage(key, image)
          images.push(key)
          if (images.length === Object.keys(maps.symbols).length) {
            initMap()
          }
        })
      })
    })
  })

  // Whenever new target areas are loaded we set state from the appropriate warning
  map.on('sourcedata', (e) => {
    if (e.sourceId !== 'polygons' && !e.isSourceLoaded) return
    setTargetAreaState()
  })

  // Map has finishing drawing so we have the bounds
  map.once('load', toggleReset)

  // Set selected feature and polygon states when features have loaded
  // dataLayers.forEach((layer) => {
  //   const change = layer.getSource().on('change', (e) => {
  //     if (e.target.getState() === 'ready') {
  //       unByKey(change) // Remove ready event when layer is ready
  //       if (layer.get('ref') === 'warnings') {
  //         // Add optional target area
  //         if (targetArea.pointFeature) {
  //           if (!warnings.getSource().getFeatureById(targetArea.pointFeature.getId())) {
  //             // Add point feature
  //             warnings.getSource().addFeature(targetArea.pointFeature)
  //             // VectorSource: Add polygon not required if VectorTileSource
  //             if (targetArea.polygonFeature && targetAreaPolygons.getSource() instanceof VectorSource) {
  //               targetAreaPolygons.getSource().addFeature(targetArea.polygonFeature)
  //             }
  //           }
  //         }
  //       }
  //       // WebGL: Limited dynamic styling could be done server side for client performance
  //       if (['river', 'tide', 'groundwater', 'rainfall'].includes(layer.get('ref'))) {
  //         setFeatueState(layer)
  //       }
  //       // Set feature visibility after all features have loaded
  //       // const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
  //       // setFeatureVisibility(lyrs, layer)
  //       // Store reference to warnings source for use in vector tiles style function
  //       if (layer.get('ref') === 'warnings') {
  //         const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
  //         setFeatureVisibility(lyrs)
  //         maps.warningsSource = warnings.getSource()
  //         map.addLayer(targetAreaPolygons)
  //       }
  //       // Attempt to set selected feature when layer is ready
  //       setSelectedFeature(state.selectedFeatureId)
  //       // Show overlays
  //       showOverlays()
  //     }
  //   })
  // })

  // Set key symbols, opacity, history and overlays on map pan or zoom (fires on map load aswell)
  // let timer = null
  // map.addEventListener('moveend', (e) => {
  //   // Toggle key symbols depending on resolution
  //   toggleKeySymbol()
  //   // Set polygon layer opacity
  //   setOpacityTargetAreaPolygons()
  //   // Timer used to stop 100 url replaces in 30 seconds limit
  //   clearTimeout(timer)
  //   // Clear viewport description to force screen reader to re-read
  //   viewportDescription.innerHTML = ''
  //   // Tasks dependent on a time delay
  //   timer = setTimeout(() => {
  //     if (!container.map) return
  //     // Show overlays for visible features
  //     showOverlays()
  //     // Update url (history state) to reflect new extent
  //     const ext = getLonLatFromExtent(map.getView().calculateExtent(map.getSize()))
  //     replaceHistory('ext', ext.join(','))
  //     // Show reset button if extent has changed
  //     if (isNewExtent(ext)) {
  //       resetButton.removeAttribute('disabled')
  //     }
  //     // Fix margin issue
  //     map.updateSize()
  //   }, 350)
  // })

  let timer = null
  map.on('moveend', () => {
    // Clear viewport description to force screen reader to re-read
    viewportDescription.innerHTML = ''
    // Tasks dependent on a time delay
    clearTimeout(timer)
    timer = setTimeout(() => {
      // Update url (history state) to reflect new extent
      const ext = maps.getExtentFromBounds(map.getBounds())
      replaceHistory('ext', ext.join(','))
      // Show reset button if extent has changed
      if (isNewExtent(ext)) {
        resetButton.removeAttribute('disabled')
      }
    }, 350)
  })

  // Map click
  map.on('click', (e) => {
    const renderedFeatures = map.queryRenderedFeatures(e.point, { layers: featureLayers, validate: false })
    let feature = renderedFeatures.length ? renderedFeatures[0] : null
    if (feature && feature.source === 'polygons') {
      feature = state.warnings.find(f => f.properties.id === feature.id)
      feature.layer = { id: 'warnings' }
    }
    toggleSelectedFeature(feature)
  })

  // Change cursor on feature hover
  featureLayers.forEach(layer => {
    map.on('mouseenter', layer, (e) => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', layer, (e) => {
      map.getCanvas().style.cursor = ''
    })
  })

  // Show cursor when hovering over features
  // map.addEventListener('pointermove', (e) => {
  //   // Detect vector feature at mouse coords
  //   const hit = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
  //     if (!defaultLayers.includes(layer)) { return true }
  //   })
  //   map.getTarget().style.cursor = hit ? 'pointer' : ''
  // })

  // Set selected feature if map is clicked
  // Clear overlays if non-keyboard interaction
  // map.addEventListener('click', (e) => {
  //   // Hide overlays if non-keyboard interaction
  //   if (!maps.isKeyboard) {
  //     hideOverlays()
  //   }
  //   // Get mouse coordinates and check for feature
  //   const featureId = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
  //     if (!defaultLayers.includes(layer)) {
  //       return feature.getId()
  //     }
  //   })
  //   setSelectedFeature(featureId)
  // })

  // Show overlays on first tab in from browser controls
  // viewport.addEventListener('focus', (e) => {
  //   if (maps.isKeyboard) {
  //     showOverlays()
  //   }
  // })

  // Toggle layers/features when key item clicked
  keyElement.addEventListener('click', (e) => {
    if (e.target.nodeName !== 'INPUT') { return }
    e.stopPropagation()
    state.layers = [...keyElement.querySelectorAll('input')].filter(x => x.checked).map(x => x.id)
    // targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
    replaceHistory('lyr', state.layers.join(','))
    setFeatureVisibility()
  })

  // Clear selectedfeature when info is closed
  // closeInfoButton.addEventListener('click', (e) => {
  //   setSelectedFeature()
  // })

  // Clear selectedfeature when key is opened
  // openKeyButton.addEventListener('click', (e) => {
  //   setSelectedFeature()
  // })

  // Reset map extent on reset button click
  resetButton.addEventListener('click', (e) => {
    maps.fitBoundsFromExtent(map, state.initialExt)
    resetButton.setAttribute('disabled', '')
    viewport.focus()
  })

  // Handle all liveMap specific key presses
  // containerElement.addEventListener('keyup', (e) => {
  //   // Show overlays when any key is pressed other than Escape
  //   if (e.key !== 'Escape') {
  //     showOverlays()
  //   }
  //   // Clear selected feature when pressing escape
  //   if (e.key === 'Escape' && state.selectedFeatureId !== '') {
  //     setSelectedFeature()
  //   }
  //   // Set selected feature on [1-9] key presss
  //   if (!isNaN(e.key) && e.key >= 1 && e.key <= state.visibleFeatures.length && state.visibleFeatures.length <= 9) {
  //     setSelectedFeature(state.visibleFeatures[e.key - 1].id)
  //   }
  // })

  // River level navigation
  // containerElement.addEventListener('click', (e) => {
  //   if (e.target.classList.contains('defra-button-secondary')) {
  //     const newFeatureId = e.target.getAttribute('data-id')
  //     const feature = river.getSource().getFeatureById(newFeatureId) || tide.getSource().getFeatureById(newFeatureId)
  //     setSelectedFeature(newFeatureId)
  //     panToFeature(feature)
  //   }
  // })
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createLiveMap = (mapId, options = {}) => {
  // Set meta title and page heading
  options.originalTitle = document.title
  options.heading = 'Live flood map'
  options.title = options.heading + ' - Check for flooding - GOV.UK'

  // Set initial history state
  if (!window.history.state) {
    const data = {}
    const title = options.title // document.title
    const uri = window.location.href
    window.history.replaceState(data, title, uri)
  }

  // Build default uri
  let uri = window.location.href
  uri = addOrUpdateParameter(uri, 'v', mapId)
  uri = addOrUpdateParameter(uri, 'lyr', options.layers || '')
  uri = addOrUpdateParameter(uri, 'ext', options.extent || '')
  uri = addOrUpdateParameter(uri, 'fid', options.selectedId || '')

  // Create map button
  const btnContainer = document.getElementById(mapId)
  const button = document.createElement('a')
  button.setAttribute('href', uri)
  if (options.btnType !== 'link') {
    button.setAttribute('role', 'button')
    button.setAttribute('data-module', 'govuk-button')
  }
  button.id = mapId + '-btn'
  button.innerHTML = `<svg width="15" height="20" viewBox="0 0 15 20" focusable="false"><path d="M15,7.5c0.009,3.778 -4.229,9.665 -7.5,12.5c-3.271,-2.835 -7.509,-8.722 -7.5,-12.5c0,-4.142 3.358,-7.5 7.5,-7.5c4.142,0 7.5,3.358 7.5,7.5Zm-7.5,5.461c3.016,0 5.461,-2.445 5.461,-5.461c0,-3.016 -2.445,-5.461 -5.461,-5.461c-3.016,0 -5.461,2.445 -5.461,5.461c0,3.016 2.445,5.461 5.461,5.461Z" fill="currentColor"/></svg><span>${options.btnText || 'View map'}</span><span class="govuk-visually-hidden">(Visual only)</span>`
  button.className = options.btnClasses || (options.btnType === 'link' ? 'defra-link-icon-s' : 'defra-button-secondary defra-button-secondary--icon')
  btnContainer.parentNode.replaceChild(button, btnContainer)

  // Detect keyboard interaction
  window.addEventListener('keydown', (e) => {
    maps.isKeyboard = true
  })
  // Needs keyup to detect first tab into web area
  window.addEventListener('keyup', (e) => {
    maps.isKeyboard = true
  })
  window.addEventListener('pointerdown', (e) => {
    maps.isKeyboard = false
  })
  window.addEventListener('focusin', (e) => {
    if (maps.isKeyboard) {
      e.target.setAttribute('keyboard-focus', '')
    }
  })
  window.addEventListener('focusout', (e) => {
    forEach(document.querySelectorAll('[keyboard-focus]'), (element) => {
      element.removeAttribute('keyboard-focus')
    })
  })

  // Create map on button press
  button.addEventListener('click', (e) => {
    // Advance history
    const data = { v: mapId, isBack: true }
    const title = options.title // document.title
    let uri = window.location.href
    uri = addOrUpdateParameter(uri, 'v', mapId)
    // Add any querystring parameters from constructor
    if (options.layers) { uri = addOrUpdateParameter(uri, 'lyr', options.layers) }
    if (options.extent) { uri = addOrUpdateParameter(uri, 'ext', options.extent) }
    if (options.selectedId) { uri = addOrUpdateParameter(uri, 'fid', options.selectedId) }
    window.history.pushState(data, title, uri)
    options.isBack = true
    return new LiveMap(mapId, options)
  })

  // Recreate map on browser history change
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.v === mapId) {
      options.isBack = window.history.state.isBack
      return new LiveMap(e.state.v, options)
    }
  })

  // Recreate map on page refresh
  if (window.flood.utils.getParameterByName('v') === mapId) {
    options.isBack = window.history.state.isBack
    return new LiveMap(mapId, options)
  }
}
