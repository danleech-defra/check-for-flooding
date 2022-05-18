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
    polygons: {
      type: 'vector',
      tiles: [`${window.location.origin}/service/vector-tiles/{z}/{x}/{y}.pbf`],
      maxzoom: 12,
      promoteId: 'id'
    },
    warnings: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      promoteId: 'id'
    },
    stations: {
      type: 'geojson',
      data: `${window.location.origin}/service/geojson/stations`,
      promoteId: 'id'
    },
    selected: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
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
  'target-areas': {
    id: 'target-areas',
    source: 'polygons',
    'source-layer': 'targetareas',
    type: 'fill',
    paint: {
      'fill-color': ['match', ['feature-state', 'status'],
        'severe', '#D4351C',
        'warning', '#D4351C',
        'alert', '#F47738',
        '#626A6E'
      ]
    },
    filter: ['in', 'id', ''],
    minzoom: 10
  },
  warnings: {
    id: 'warnings',
    source: 'warnings',
    type: 'symbol',
    layout: {
      'icon-image': ['concat', ['get', 'status'], ['get', 'selected']],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': ['match', ['get', 'status'],
        'severe', 3,
        'warning', 2,
        'alert', 1,
        1
      ]
    }
  },
  stations: {
    id: 'stations',
    source: 'stations',
    type: 'symbol',
    layout: {
      'icon-image': ['step', ['zoom'],
        ['concat', 'level-', ['get', 'status'], ['get', 'selected']], 10,
        ['concat', ['get', 'type'], '-', ['get', 'status'], ['get', 'selected']]
      ],
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'symbol-z-order': 'source',
      'symbol-sort-key': ['match', ['get', 'status'],
        'withrisk', 4,
        'default', 3,
        'norisk', 2,
        'error', 1,
        1
      ]
    }
  },
  selected: {
    id: 'selected',
    source: 'selected',
    type: 'symbol',
    layout: {
      'icon-size': 0.5,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true
    }
  }
}
