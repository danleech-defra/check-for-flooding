'use strict'
/*
Sets up the window.flood.maps styles objects
*/

window.flood.maps.style = {
  source: {
    aerial: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']
    },
    'target-areas': {
      type: 'vector',
      tiles: [`${window.location.origin}/service/vector-tiles/{z}/{x}/{y}.pbf`],
      maxzoom: 12
    },
    stations: {
      type: 'geojson',
      data: `${window.location.origin}/service/geojson/stations`
    }
  },
  aerial: {
    id: 'aerial',
    type: 'raster',
    source: 'aerial',
    layout: {
      visibility: 'none'
    }
  },
  alerts: {
    id: 'alerts',
    source: 'warnings', // Added at run time
    type: 'symbol',
    filter: ['in', 'id', ''],
    layout: {
      'icon-image': 'Airport',
      'icon-size': 0.5
    }
  },
  'severe-polygons-fill': {
    id: 'severe-polygons-fill',
    source: 'target-areas',
    'source-layer': 'targetareas',
    type: 'fill',
    paint: {
      'fill-color': '#e3000f'
    },
    filter: ['in', 'id', '']
  },
  'warning-polygons-fill': {
    id: 'warning-polygons-fill',
    source: 'target-areas',
    'source-layer': 'targetareas',
    type: 'fill',
    paint: {
      'fill-color': '#e3000f'
    },
    filter: ['in', 'id', '']
  },
  'alert-polygons-fill': {
    id: 'alert-polygons-fill',
    source: 'target-areas',
    'source-layer': 'targetareas',
    type: 'fill',
    paint: {
      'fill-color': '#f18700',
      'fill-opacity': 0.5
    },
    filter: ['in', 'id', '']
  },
  'alert-polygons-stroke': {
    id: 'alert-polygons-stroke',
    source: 'target-areas',
    'source-layer': 'targetareas',
    type: 'line',
    'line-join': 'round',
    'line-cap': 'round',
    'line-miter-limit': 10,
    paint: {
      'line-color': '#ffdd00',
      'line-width': 4,
      'line-offset': -2
    },
    filter: ['in', 'id', '']
  },
  'river-stations': {
    id: 'river-stations',
    source: 'stations',
    type: 'symbol',
    layout: {
      'icon-image': ['match', ['get', 'latestState'],
        'high', 'level-withrisk',
        ['match', ['get', 'status'], 'active', 'level', 'level-error']
      ],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'symbol-sort-key': ['match', ['get', 'latestState'],
        'high', 3,
        'normal', 2,
        'low', 2,
        1
      ]
    },
    filter: ['==', ['get', 'type'], 'river']
  },
  'sea-stations': {
    id: 'sea-stations',
    source: 'stations',
    type: 'symbol',
    layout: {
      'icon-image': ['match', ['get', 'status'],
        'active', 'level',
        'level-error'
      ],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'symbol-sort-key': ['match', ['get', 'status'],
        'active', 2,
        1
      ]
    },
    filter: ['==', ['get', 'type'], 'sea']
  }
}
