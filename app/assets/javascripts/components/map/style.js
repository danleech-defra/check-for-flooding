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
    warnings: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      promoteId: 'id'
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
  'severe-polygons-fill': {
    id: 'severe-polygons-fill',
    source: 'target-areas',
    'source-layer': 'targetareas',
    type: 'fill',
    paint: {
      'fill-color': '#e3000f'
    },
    filter: ['in', 'id', ''],
    minzoom: 10
  },
  'warning-polygons-fill': {
    id: 'warning-polygons-fill',
    source: 'target-areas',
    'source-layer': 'targetareas',
    type: 'fill',
    paint: {
      'fill-color': '#e3000f'
    },
    filter: ['in', 'id', ''],
    minzoom: 10
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
    filter: ['in', 'id', ''],
    minzoom: 10
  },
  // 'alert-polygons-stroke': {
  //   id: 'alert-polygons-stroke',
  //   source: 'target-areas',
  //   'source-layer': 'targetareas',
  //   type: 'line',
  //   'line-join': 'round',
  //   'line-cap': 'round',
  //   'line-miter-limit': 10,
  //   paint: {
  //     'line-color': '#ffdd00',
  //     'line-width': 4,
  //     'line-offset': -2
  //   },
  //   filter: ['in', 'id', '']
  // },
  severe: {
    id: 'severe',
    source: 'warnings',
    type: 'symbol',
    layout: {
      'icon-image': 'severe',
      'icon-size': 0.5,
      'icon-allow-overlap': true
    },
    filter: ['all', ['==', ['get', 'severity'], 1], ['<', ['zoom'], 10]]
  },
  warning: {
    id: 'warning',
    source: 'warnings',
    type: 'symbol',
    layout: {
      'icon-image': 'warning',
      'icon-size': 0.5,
      'icon-allow-overlap': true
    },
    filter: ['all', ['==', ['get', 'severity'], 2], ['<', ['zoom'], 10]]
  },
  alert: {
    id: 'alert',
    source: 'warnings',
    type: 'symbol',
    layout: {
      'icon-image': 'alert',
      'icon-size': 0.5,
      'icon-allow-overlap': true
    },
    filter: ['all', ['==', ['get', 'severity'], 3], ['<', ['zoom'], 10]]
  },
  removed: {
    id: 'removed',
    source: 'warnings',
    type: 'symbol',
    layout: {
      'icon-image': 'removed',
      'icon-size': 0.5,
      'icon-allow-overlap': true
    },
    filter: ['==', ['get', 'severity'], 4]
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
