'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke, Text, Circle } from 'ol/style'

window.flood.maps.styles = {

  //
  // Vector styles live
  //

  targetAreaPolygons: (feature) => {
    // Use corresposnding warning feature propeties for styling
    const warningsSource = window.flood.maps.warningsSource
    const warningId = feature.getId()
    const warning = warningsSource.getFeatureById(warningId)
    if (!warning || !warning.get('isVisible')) { return new Style() }
    const severity = warning.get('severity')
    const isSelected = warning.get('isSelected')
    const isGroundwater = warning.getId().substring(6, 9) === 'FAG'

    // Defaults
    let strokeColour = 'transparent'
    let fillColour = 'transparent'
    let zIndex = 1

    switch (severity) {
      case 1: // Severe warning
        strokeColour = '#D4351C'
        fillColour = targetAreaPolygonPattern('severe')
        zIndex = 11
        break
      case 2: // Warning
        strokeColour = '#D4351C'
        fillColour = targetAreaPolygonPattern('warning')
        zIndex = 10
        break
      case 3: // Alert
        strokeColour = '#F47738'
        fillColour = targetAreaPolygonPattern('alert')
        zIndex = isGroundwater ? 4 : 7
        break
      default: // Removed or inactive
        strokeColour = '#626A6E'
        fillColour = targetAreaPolygonPattern('removed')
        zIndex = 1
    }
    zIndex = isSelected ? zIndex + 2 : zIndex

    const selectedStroke = new Style({ stroke: new Stroke({ color: '#FFDD00', width: 16 }), zIndex: zIndex })
    const stroke = new Style({ stroke: new Stroke({ color: strokeColour, width: 2 }), zIndex: zIndex })
    const fill = new Style({ fill: new Fill({ color: fillColour }), zIndex: zIndex })

    return isSelected ? [selectedStroke, stroke, fill] : [stroke, fill]
  },

  warnings: (feature, resolution) => {
    // Hide warning symbols or hide when polygon is shown
    if (!feature.get('isVisible') || resolution < window.flood.maps.liveMaxBigZoom) {
      return
    }
    const severity = feature.get('severity')
    const isSelected = feature.get('isSelected')
    switch (severity) {
      case 1: // Severe warning
        return isSelected ? styleCache.severeSelected : styleCache.severe
      case 2: // Warning
        return isSelected ? styleCache.warningSelected : styleCache.warning
      case 3: // Alert
        return isSelected ? styleCache.alertSelected : styleCache.alert
      default: // Removed or inactive
        return isSelected ? styleCache.targetAreaSelected : styleCache.targetArea
    }
  },

  stations: (feature, resolution) => {
    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const isSymbol = resolution <= window.flood.maps.liveMaxBigZoom
    switch (state) {
      // Rivers
      case 'river':
        return isSelected ? (isSymbol ? styleCache.riverSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.river : styleCache.measurement)
      case 'riverHigh':
        return isSelected ? (isSymbol ? styleCache.riverHighSelected : styleCache.measurementAlertSelected) : (isSymbol ? styleCache.riverHigh : styleCache.measurementAlert)
      case 'riverError':
        return isSelected ? (isSymbol ? styleCache.riverErrorSelected : styleCache.measurementErrorSelected) : (isSymbol ? styleCache.riverError : styleCache.measurementError)
      // Tide
      case 'tide':
        return isSelected ? (isSymbol ? styleCache.tideSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.tide : styleCache.measurement)
      case 'tideError':
        return isSelected ? (isSymbol ? styleCache.tideErrorSelected : styleCache.measurementErrorSelected) : (isSymbol ? styleCache.tideError : styleCache.measurementError)
      // Ground
      case 'groundHigh':
        return isSelected ? (isSymbol ? styleCache.groundHighSelected : styleCache.measurementAlertSelected) : (isSymbol ? styleCache.groundHigh : styleCache.measurementAlert)
      case 'groundError':
        return isSelected ? (isSymbol ? styleCache.groundErrorSelected : styleCache.measurementErrorSelected) : (isSymbol ? styleCache.groundError : styleCache.measurementError)
      case 'ground':
        return isSelected ? (isSymbol ? styleCache.groundSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.ground : styleCache.measurement)
      // Rainfall
      case 'rainHeavy':
        return isSelected ? (isSymbol ? styleCache.rainHeavySelected : styleCache.measurementAlertSelected) : (isSymbol ? styleCache.rainHeavy : styleCache.measurementAlert)
      case 'rainModerate':
        return isSelected ? (isSymbol ? styleCache.rainModerateSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.rainModerate : styleCache.measurement)
      case 'rainLight':
        return isSelected ? (isSymbol ? styleCache.rainLightSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.rainLight : styleCache.measurement)
      case 'rainError':
        return isSelected ? (isSymbol ? styleCache.rainErrorSelected : styleCache.measurementErrorSelected) : (isSymbol ? styleCache.rainError : styleCache.measurementError)
      case 'rain':
        return isSelected ? (isSymbol ? styleCache.rainSelected : styleCache.measurementSelected) : (isSymbol ? styleCache.rain : styleCache.measurement)
    }
  },

  //
  // Vector styles outlook
  //

  outlookPolygons: (feature) => {
    if (!feature.get('isVisible')) { return }
    const zIndex = feature.get('z-index')
    const lineDash = [2, 3]
    let strokeColour = '#85994b'
    let fillColour = outlookPolygonPattern('veryLow')
    if (feature.get('risk-level') === 2) {
      strokeColour = '#ffdd00'
      fillColour = outlookPolygonPattern('low')
    } else if (feature.get('risk-level') === 3) {
      strokeColour = '#F47738'
      fillColour = outlookPolygonPattern('medium')
    } else if (feature.get('risk-level') === 4) {
      strokeColour = '#D4351C'
      fillColour = outlookPolygonPattern('high')
    }
    const isSelected = feature.get('isSelected')
    const selectedStroke = new Style({ stroke: new Stroke({ color: '#FFDD00', width: 16 }), zIndex: zIndex })
    const style = new Style({
      stroke: new Stroke({ color: strokeColour, width: 1 }),
      fill: new Fill({ color: fillColour }),
      lineDash: lineDash,
      zIndex: zIndex
    })
    return isSelected ? [selectedStroke, style] : style
  },

  places: (feature, resolution) => {
    // Hide places that are not appropriate for resolution
    const d = parseInt(feature.get('d'))
    const s = parseInt(feature.get('s'))
    const r = parseInt(resolution)
    let showName = d >= 1
    if (r > 1600 && d > 1) {
      showName = false
    } else if (r > 800 && d > 2) {
      showName = false
    } else if (r > 400 && d > 3) {
      showName = false
    } else if (d > 4) {
      showName = false
    }
    if (!showName) {
      return
    }
    // Get appropriate style from cache and set text
    const textStyle = s === 1 ? styleCache.textLarge : styleCache.text
    textStyle[0].getText().setText(feature.get('n'))
    textStyle[1].getText().setText(feature.get('n'))
    return textStyle
  }

  //
  // WebGL styles
  //

  // warningsJSON: {
  //   filter: ['case',
  //     ['<', ['resolution'], 100],
  //     false,
  //     ['case',
  //       ['==', ['get', 'isVisible'], 'true'],
  //       true,
  //       false
  //     ]
  //   ],
  //   symbol: {
  //     symbolType: 'image',
  //     src: '/public/images/map-symbols-2x.png',
  //     size: 50,
  //     rotateWithView: false,
  //     offset: [0, 0],
  //     textureCoord: ['match', ['get', 'severity_value'],
  //       3, [0, 0, 0.5, 0.04761904761],
  //       2, [0, 0.04761904761, 0.5, 0.09523809523],
  //       1, [0, 0.09523809523, 0.5, 0.14285714285],
  //       [0, 0.14285714285, 0.5, 0.19047619047]
  //     ]
  //   }
  // },

  // measurementsJSON: {
  //   filter: ['==', ['get', 'isVisible'], 'true'],
  //   symbol: {
  //     symbolType: 'image',
  //     src: '/public/images/map-symbols-2x.png',
  //     size: 50,
  //     rotateWithView: false,
  //     offset: [0, 0],
  //     textureCoord: ['match', ['get', 'state'],
  //       'rainHeavy', ['case', ['<=', ['resolution'], 100], [0, 0.61904761904, 0.5, 0.66666666666], [0, 0.85714285714, 0.5, 0.90476190476]],
  //       'rainModerate', ['case', ['<=', ['resolution'], 100], [0, 0.66666666666, 0.5, 0.71428571428], [0, 0.90476190476, 0.5, 0.95238095238]],
  //       'rainLight', ['case', ['<=', ['resolution'], 100], [0, 0.71428571428, 0.5, 0.7619047619], [0, 0.90476190476, 0.5, 0.95238095238]],
  //       'rain', ['case', ['<=', ['resolution'], 100], [0, 0.7619047619, 0.5, 0.80952380952], [0, 0.90476190476, 0.5, 0.95238095238]],
  //       'rainError', ['case', ['<=', ['resolution'], 100], [0, 0.80952380952, 0.5, 0.85714285714], [0, 0.95238095238, 0.5, 1]],
  //       'tide', ['case', ['<=', ['resolution'], 100], [0, 0.38095238095, 0.5, 0.42857142857], [0, 0.90476190476, 0.5, 0.95238095238]],
  //       'tideError', ['case', ['<=', ['resolution'], 100], [0, 0.42857142857, 0.5, 0.47619047619], [0, 0.95238095238, 0.5, 1]],
  //       'ground', ['case', ['<=', ['resolution'], 100], [0, 0.52380952381, 0.5, 0.57142857142], [0, 0.90476190476, 0.5, 0.95238095238]],
  //       'groundHigh', ['case', ['<=', ['resolution'], 100], [0, 0.47619047619, 0.5, 0.52380952381], [0, 0.85714285714, 0.5, 0.90476190476]],
  //       'groundError', ['case', ['<=', ['resolution'], 100], [0, 0.57142857142, 0.5, 0.61904761904], [0, 0.95238095238, 0.5, 1]],
  //       'riverHigh', ['case', ['<=', ['resolution'], 100], [0, 0.23809523809, 0.5, 0.28571428571], [0, 0.85714285714, 0.5, 0.90476190476]],
  //       'riverError', ['case', ['<=', ['resolution'], 100], [0, 0.33333333333, 0.5, 0.38095238095], [0, 0.95238095238, 0.5, 1]],
  //       ['case', ['<=', ['resolution'], 100], [0, 0.28571428571, 0.5, 0.33333333333], [0, 0.90476190476, 0.5, 0.95238095238]]
  //     ]
  //   }
  // }
}

//
// SVG fill paterns
//

const targetAreaPolygonPattern = (style) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (style) {
    case 'severe':
      ctx.fillStyle = '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(0, 4.7)
      ctx.closePath()
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(8, 4.7)
      ctx.closePath()
      ctx.fill()
      break
    case 'warning':
      ctx.fillStyle = '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(0, 3.3)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.moveTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(7.3, 4)
      ctx.lineTo(4, 0.7)
      ctx.closePath()
      ctx.moveTo(0, 4.7)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(4, 7.3)
      ctx.lineTo(0.7, 4)
      ctx.closePath()
      ctx.fill()
      break
    case 'alert':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#F47738'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(3.3, 0)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.fill()
      break
    case 'removed':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#626A6E'
      ctx.arc(4, 4, 1, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      break
  }
  ctx.restore()
  return ctx.createPattern(canvas, 'repeat')
}

const outlookPolygonPattern = (style) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (style) {
    case 'high':
      ctx.fillStyle = '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(0, 4.7)
      ctx.closePath()
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(8, 4.7)
      ctx.closePath()
      ctx.fill()
      break
    case 'medium':
      ctx.fillStyle = '#F47738'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(0, 3.3)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.moveTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(7.3, 4)
      ctx.lineTo(4, 0.7)
      ctx.closePath()
      ctx.moveTo(0, 4.7)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(4, 7.3)
      ctx.lineTo(0.7, 4)
      ctx.closePath()
      ctx.fill()
      break
    case 'low':
      ctx.fillStyle = '#ffdd00'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(3.3, 0)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.fill()
      break
    case 'veryLow':
      ctx.fillStyle = '#85994b'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.arc(4, 4, 1, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      break
  }
  ctx.restore()
  return ctx.createPattern(canvas, 'repeat')
}

//
// Style caching, improves render performance
//

const createTextStyle = (options) => {
  const defaults = {
    font: '14px GDS Transport, Arial, sans-serif',
    offsetY: -12,
    radius: 2
  }
  options = Object.assign({}, defaults, options)
  return [
    new Style({
      text: new Text({
        font: options.font,
        offsetY: options.offsetY,
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    }),
    new Style({
      text: new Text({
        font: options.font,
        offsetY: options.offsetY
      }),
      image: new Circle({
        fill: new Fill({
          color: '#0b0c0c'
        }),
        stroke: new Stroke({
          width: 0
        }),
        radius: options.radius
      })
    })
  ]
}

const createIconStyle = (options) => {
  const defaults = {
    size: [100, 100],
    anchor: [0.5, 0.5],
    offset: [0, 0],
    scale: 0.5,
    zIndex: 1
  }
  options = Object.assign({}, defaults, options)
  return new Style({
    image: new Icon({
      src: '/public/images/map-symbols-2x.png',
      size: options.size,
      anchor: options.anchor,
      offset: options.offset,
      scale: options.scale
    }),
    zIndex: options.zIndex
  })
}

const styleCache = {
  severe: createIconStyle({ offset: [0, 0], zIndex: 5 }),
  severeSelected: createIconStyle({ offset: [100, 0], zIndex: 10 }),
  warning: createIconStyle({ offset: [0, 100], zIndex: 4 }),
  warningSelected: createIconStyle({ offset: [100, 100], zIndex: 10 }),
  alert: createIconStyle({ offset: [0, 200], zIndex: 3 }),
  alertSelected: createIconStyle({ offset: [100, 200], zIndex: 10 }),
  targetArea: createIconStyle({ offset: [0, 300], zIndex: 1 }),
  targetAreaSelected: createIconStyle({ offset: [100, 300], zIndex: 10 }),
  // River
  river: createIconStyle({ offset: [0, 600], zIndex: 2 }),
  riverSelected: createIconStyle({ offset: [100, 600], zIndex: 10 }),
  riverHigh: createIconStyle({ offset: [0, 500], zIndex: 3 }),
  riverHighSelected: createIconStyle({ offset: [100, 500], zIndex: 10 }),
  riverError: createIconStyle({ offset: [0, 700], zIndex: 1 }),
  riverErrorSelected: createIconStyle({ offset: [100, 700], zIndex: 10 }),
  // Tide
  tide: createIconStyle({ offset: [0, 800], zIndex: 2 }),
  tideSelected: createIconStyle({ offset: [100, 800], zIndex: 10 }),
  tideError: createIconStyle({ offset: [0, 900], zIndex: 1 }),
  tideErrorSelected: createIconStyle({ offset: [100, 900], zIndex: 10 }),
  // Groundwater
  ground: createIconStyle({ offset: [0, 1100], zIndex: 2 }),
  groundSelected: createIconStyle({ offset: [100, 1100], zIndex: 10 }),
  groundHigh: createIconStyle({ offset: [0, 1000], zIndex: 3 }),
  groundHighSelected: createIconStyle({ offset: [100, 1000], zIndex: 10 }),
  groundError: createIconStyle({ offset: [0, 1200], zIndex: 1 }),
  groundErrorSelected: createIconStyle({ offset: [100, 1200], zIndex: 10 }),
  // Rainfall
  rain: createIconStyle({ offset: [0, 1600], zIndex: 3 }),
  rainSelected: createIconStyle({ offset: [100, 1600], zIndex: 10 }),
  rainHeavy: createIconStyle({ offset: [0, 1300], zIndex: 3 }),
  rainHeavySelected: createIconStyle({ offset: [100, 1300], zIndex: 10 }),
  rainModerate: createIconStyle({ offset: [0, 1400], zIndex: 3 }),
  rainModerateSelected: createIconStyle({ offset: [100, 1400], zIndex: 10 }),
  rainLight: createIconStyle({ offset: [0, 1500], zIndex: 3 }),
  rainLightSelected: createIconStyle({ offset: [100, 1500], zIndex: 10 }),
  rainError: createIconStyle({ offset: [0, 1700], zIndex: 3 }),
  rainErrorSelected: createIconStyle({ offset: [100, 1700], zIndex: 10 }),
  // Measurements
  measurement: createIconStyle({ offset: [0, 1900], zIndex: 2 }),
  measurementSelected: createIconStyle({ offset: [100, 1900], zIndex: 10 }),
  measurementAlert: createIconStyle({ offset: [0, 1800], zIndex: 3 }),
  measurementAlertSelected: createIconStyle({ offset: [100, 1800], zIndex: 10 }),
  measurementError: createIconStyle({ offset: [0, 2000], zIndex: 1 }),
  measurementErrorSelected: createIconStyle({ offset: [100, 2000], zIndex: 10 }),
  text: createTextStyle(),
  textLarge: createTextStyle({ font: 'Bold 16px GDS Transport, Arial, sans-serif', offsetY: -13, radius: 3 })
}

// const createIconStyle = (options) => {
//   return new Style({
//     image: new Icon({
//       src: 'data:image/svg+xml;base64,' + window.btoa(options.src),
//       size: [50, 50],
//       imgSize: [50, 50],
//       anchor: [0.5, 0.5],
//       offset: [0, 0],
//       scale: 1
//     }),
//     zIndex: options.zIndex
//   })
// }

// const graphics = [
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><path d="M25.032 10.924c.606.019 1.161.351 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875z" fill="#e3000f"/><path d="M25.072 9.424h-.028c-1.246-.01-2.258.617-2.838 1.629l-.012.022L8.849 35.817l-.012.023c-1.064 2.099.628 4.63 2.796 4.682l.025.001h26.691l.024-.001c2.372-.057 3.775-2.752 2.796-4.682l-.012-.023-13.344-24.741c-.004-.008-.009-.016-.013-.023a3.28 3.28 0 0 0-2.728-1.629zm-.04 1.5c.606.019 1.161.351 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875zm-.313 2.35a.32.32 0 0 1 .284-.17.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318a.32.32 0 0 1-.277.157H12.324c-.113 0-.219-.059-.277-.157s-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M22.603 21.487v1.086l1.846-2.209c.107-.129.265-.204.43-.203s.324.076.43.204l5.342 6.426h.001c.204.249.178.618-.059.836s-.598.187-.803-.061l-.489-.587v.96c-.167.015-.249.061-.396.155l-.459.331v-1.372h-1.705v1.624c-.203-.063-.395-.156-.57-.278-.266-.185-.427-.329-.568-.392-.095-.044-.185-.071-.345-.072-.173-.003-.343.053-.48.159-.164.106-.379.314-.731.483-.234.111-.525.186-.853.184-.477.004-.87-.174-1.139-.352l-.581-.401c-.072-.041-.153-.062-.236-.062-.179-.008-.486.123-.836.324v-1.258l-.49.586c-.106.128-.264.203-.43.204-.132 0-.265-.048-.373-.146-.236-.218-.261-.588-.056-.836l2.217-2.653v-2.68h1.333z" fill="#e3000f"/><path d="M17.336 28.613l.014.017c.181.214.383.409.602.584.281.211.63.443 1.115.452.567-.016.952-.29 1.316-.481.359-.206.673-.341.855-.333.083 0 .164.021.236.062.129.062.309.22.581.401s.662.356 1.139.351c.328.002.619-.073.852-.183.353-.169.568-.377.732-.483.169-.109.253-.154.48-.16.119-.003.237.022.345.073.142.063.301.206.568.391.258.181.649.363 1.126.363l.024-.001c.327.002.618-.072.852-.183.352-.169.569-.377.732-.483.169-.109.253-.154.48-.16a1.01 1.01 0 0 1 .468.147c.07.04.131.081.169.11l.041.033.045.037a2.76 2.76 0 0 0 .533.331c.224.102.5.17.807.168.517.002.931-.233 1.202-.47l.154-.145.516.995c-.07.074-.144.143-.222.208-.185.16-.447.356-.708.501s-.523.234-.656.229c-.352-.009-.485-.105-.762-.304-.057-.049-.204-.167-.421-.29-.264-.147-.634-.308-1.086-.311-.334-.001-.629.078-.865.193-.356.175-.58.391-.771.513a1.04 1.04 0 0 1-.634.199c-.193-.002-.312-.037-.431-.092-.178-.08-.359-.243-.641-.438s-.686-.38-1.196-.375c-.334-.001-.629.078-.865.193-.357.175-.58.391-.771.514a1.05 1.05 0 0 1-.633.198c-.35-.006-.525-.126-.828-.344-.147-.107-.315-.238-.531-.351s-.488-.198-.792-.197c-.611.007-1.094.29-1.504.511-.403.235-.754.395-.884.381-.063-.01-.199-.063-.348-.152-.226-.133-.491-.337-.71-.524l-.408-.382.683-1.313zm-2.606 5.005l.139.131c.266.242.617.537.989.785.186.125.378.238.578.327s.408.16.663.162c.656-.017 1.133-.344 1.593-.587.454-.258.867-.445 1.147-.436a.73.73 0 0 1 .363.093c.185.091.414.292.746.511s.79.424 1.361.419c.351.004.699-.07 1.017-.218.419-.199.685-.452.903-.595a1.1 1.1 0 0 1 .685-.225 1.1 1.1 0 0 1 .495.105c.204.092.412.279.736.503s.787.437 1.372.431c.394.001.738-.087 1.017-.218.42-.2.686-.453.904-.596.224-.145.367-.219.684-.225.214-.002.468.092.661.202a2.29 2.29 0 0 1 .228.149l.058.046.012.009.04.033c.325.252.845.6 1.576.6h.03c.663-.013 1.228-.332 1.715-.649.241-.161.457-.33.633-.481l.166-.148 1.302 2.508H13.357l1.373-2.636zm1.404-2.695a.74.74 0 0 0 .082.119 4.81 4.81 0 0 0 .691.67c.323.243.723.508 1.28.52.651-.02 1.093-.334 1.511-.552.41-.237.771-.393.98-.383.095-.001.188.023.271.07.149.072.356.253.668.46s.76.409 1.307.405a2.26 2.26 0 0 0 .978-.212c.405-.193.652-.432.84-.553.157-.123.352-.188.551-.184.183.002.287.033.396.084.163.072.347.237.653.449.378.267.829.412 1.292.416h.027c.375.001.71-.084.979-.211.404-.194.652-.432.84-.554.194-.125.29-.177.55-.184.162-.003.374.074.537.168.082.046.15.094.195.127l.047.038.009.007.042.035a3.19 3.19 0 0 0 .612.38c.258.118.574.195.926.194.595.002 1.069-.269 1.38-.541a2.89 2.89 0 0 0 .263-.256l.594 1.143c-.027.022-.051.046-.073.073h-.001c-.02.026-.129.137-.269.255-.212.183-.513.409-.812.575s-.601.268-.753.263c-.404-.01-.557-.12-.874-.349-.066-.056-.236-.192-.484-.333-.303-.169-.728-.354-1.247-.357-.384-.002-.721.089-.993.221-.409.201-.665.449-.885.59-.211.154-.466.234-.727.228-.171.004-.341-.033-.496-.106-.203-.091-.411-.279-.735-.502-.401-.283-.881-.434-1.372-.431-.385-.002-.722.089-.994.221-.409.201-.666.449-.885.59s-.383.221-.726.228c-.402-.007-.603-.144-.951-.395-.169-.123-.361-.273-.61-.402s-.559-.229-.909-.227c-.701.008-1.255.333-1.725.587-.464.269-.866.453-1.015.437-.073-.011-.229-.072-.399-.175-.259-.152-.565-.386-.815-.601l-.501-.474-.045-.047.795-1.524z" fill="#00a4cd"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><path d="M25.048 10.924a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z" fill="#e3000f"/><path d="M25.285 1.927l-.167-.003c-4.128-.032-7.481 2.046-9.403 5.4l-.077.136L2.237 32.307l-.073.14c-3.54 6.981 2.091 15.398 9.304 15.573l.145.002h26.812l.146-.002c7.89-.191 12.559-9.154 9.303-15.572l-.072-.139L34.4 7.46l-.076-.135c-1.839-3.209-5.346-5.301-9.039-5.398zm-.237 8.997a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z" fill="#fd0"/><path d="M24.732 13.274c.056-.105.166-.17.284-.17a.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318s-.163.158-.277.157H12.337a.32.32 0 0 1-.277-.157c-.058-.097-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M22.767 21.487v1.086l1.846-2.209c.108-.129.265-.204.43-.203a.57.57 0 0 1 .431.204l5.341 6.426h.001c.204.249.178.618-.059.836s-.598.187-.803-.061l-.489-.587v.96c-.166.015-.249.061-.395.155l-.46.331v-1.372h-1.705v1.624a2.02 2.02 0 0 1-.569-.278c-.267-.185-.427-.329-.569-.392-.095-.044-.185-.071-.345-.072-.173-.003-.342.053-.48.159-.163.106-.379.314-.731.483-.234.111-.525.186-.852.184-.477.004-.87-.174-1.139-.352l-.582-.401c-.072-.041-.153-.062-.236-.062-.178-.008-.486.123-.836.324v-1.258l-.489.586c-.113.134-.271.204-.431.204-.132 0-.265-.048-.373-.146-.236-.218-.26-.588-.056-.836l2.217-2.653v-2.68h1.333z" fill="#e3000f"/><path d="M17.366 28.613c.004.006.009.011.013.017a4.38 4.38 0 0 0 .603.584c.281.211.629.443 1.115.452.567-.016.951-.29 1.316-.481.358-.206.672-.341.854-.333.083 0 .164.021.236.062.13.062.31.22.582.401s.662.356 1.139.351a1.97 1.97 0 0 0 .852-.183c.352-.169.568-.377.732-.483a.76.76 0 0 1 .479-.16c.16.002.25.029.346.073.141.063.301.206.568.391.258.181.648.363 1.126.363l.023-.001c.295.004.586-.059.852-.183.353-.169.569-.377.733-.483a.76.76 0 0 1 .479-.16c.141-.002.326.064.468.147.059.033.116.07.169.11l.042.033.044.037c.137.102.308.229.533.331s.5.17.807.168c.518.002.932-.233 1.202-.47l.155-.145.516.995c-.033.036-.118.12-.223.208-.184.16-.447.356-.707.501s-.523.234-.656.229c-.352-.009-.485-.105-.762-.304-.057-.049-.205-.167-.421-.29-.265-.147-.635-.308-1.087-.311-.334-.001-.628.078-.865.193-.356.175-.579.391-.771.513-.183.134-.406.204-.633.199a.96.96 0 0 1-.431-.092c-.178-.08-.359-.243-.642-.438a2.06 2.06 0 0 0-1.195-.375c-.299-.002-.595.064-.866.193-.356.175-.58.391-.771.514s-.333.192-.632.198c-.351-.006-.526-.126-.828-.344-.148-.107-.315-.238-.532-.351s-.488-.198-.792-.197c-.611.007-1.094.29-1.503.511-.404.235-.754.395-.884.381a1.21 1.21 0 0 1-.348-.152c-.226-.133-.492-.337-.71-.524l-.409-.382.684-1.313zm-2.57 5.005l.139.131c.266.242.617.537.989.785.186.125.378.238.578.327s.408.16.663.162c.656-.017 1.134-.344 1.593-.587.454-.258.868-.445 1.147-.436a.73.73 0 0 1 .363.093c.185.091.414.292.746.511s.79.424 1.361.419c.351.004.699-.07 1.017-.218.419-.199.685-.452.903-.595.224-.145.368-.219.685-.225.171-.004.341.032.495.105.204.092.412.279.736.503s.787.437 1.372.431c.394.001.738-.087 1.017-.218.42-.2.686-.453.904-.596a1.1 1.1 0 0 1 .684-.225c.214-.002.468.092.661.202a2.29 2.29 0 0 1 .228.149l.058.046.012.009.04.033c.325.252.845.6 1.576.6h.03c.663-.013 1.228-.332 1.715-.649.241-.161.457-.33.633-.481l.166-.148 1.302 2.508H13.423l1.373-2.636zm1.366-2.695c.024.042.052.082.082.119.131.153.372.42.692.67.323.243.723.508 1.28.52.65-.02 1.093-.334 1.51-.552.411-.237.772-.393.981-.383.095-.001.189.023.271.07.149.072.356.253.668.46s.759.409 1.307.405a2.26 2.26 0 0 0 .978-.212c.405-.193.652-.432.84-.553a.87.87 0 0 1 .551-.184c.183.002.287.033.396.084.163.072.347.237.653.449.379.267.829.412 1.292.416h.027c.338.003.672-.069.978-.211.405-.194.653-.432.841-.554.194-.125.29-.177.55-.184.162-.003.374.074.537.168.082.046.15.094.194.127l.048.038.008.007.043.035a3.22 3.22 0 0 0 .612.38c.258.118.574.195.926.194.595.002 1.069-.269 1.38-.541a2.89 2.89 0 0 0 .263-.256l.594 1.143a.56.56 0 0 0-.073.073h-.001c-.02.026-.129.137-.269.255-.251.218-.523.41-.813.575-.297.171-.6.268-.752.263-.404-.01-.557-.12-.874-.349-.066-.056-.236-.192-.484-.333-.303-.169-.728-.354-1.247-.357-.384-.002-.721.089-.993.221-.409.201-.665.449-.885.59a1.19 1.19 0 0 1-.727.228c-.222-.002-.359-.042-.496-.106-.203-.091-.411-.279-.735-.502-.401-.283-.881-.434-1.373-.431-.384-.002-.721.089-.993.221-.409.201-.666.449-.886.59-.21.153-.465.233-.725.228-.402-.007-.603-.144-.951-.395-.169-.123-.361-.273-.61-.402s-.559-.229-.909-.227c-.701.008-1.255.333-1.725.587-.464.269-.866.453-1.015.437-.073-.011-.229-.072-.399-.175-.26-.152-.565-.386-.815-.601l-.502-.474-.044-.047.794-1.524z" fill="#00a4cd"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><path d="M25.032 10.951a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875z" fill="#e3000f"/><path d="M25.072 9.451h-.028c-1.246-.01-2.258.617-2.838 1.629l-.012.022L8.849 35.844l-.012.023c-1.064 2.099.628 4.63 2.796 4.682l.025.001h26.691l.024-.001c2.372-.057 3.775-2.752 2.796-4.682l-.012-.023-13.344-24.741c-.004-.008-.009-.016-.013-.023a3.28 3.28 0 0 0-2.728-1.629zm-.04 1.5a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875zm-.313 2.35a.32.32 0 0 1 .284-.17.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318s-.163.157-.277.157H12.324c-.113 0-.219-.059-.277-.157s-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M22.634 22.169v1.041l1.842-2.118c.107-.124.265-.196.429-.195s.321.071.429.196l5.33 6.162.001.001a.57.57 0 0 1-.058.801c-.236.203-.598.177-.802-.058l-.487-.563v3.006c-.167.014-.249.058-.396.149-.163.101-.378.301-.73.463-.234.106-.524.177-.851.176h-.023c-.476 0-.866-.175-1.123-.348-.267-.177-.427-.315-.568-.375-.095-.042-.184-.068-.344-.069-.172-.004-.341.049-.479.153-.163.101-.378.301-.73.462-.233.106-.523.178-.85.177-.476.003-.867-.167-1.137-.338l-.58-.384c-.087-.042-.143-.058-.235-.059-.178-.009-.485.117-.834.309v-3.29l-.488.561c-.108.123-.265.194-.429.195-.132 0-.265-.045-.373-.139-.235-.205-.26-.567-.056-.802l2.212-2.543v-2.571h1.33z" fill="#181c1b"/><path d="M14.778 33.804l.139.125c.265.233.616.515.987.753.183.12.376.226.577.314.208.096.433.149.662.156.653-.017 1.131-.331 1.589-.563.453-.248.866-.427 1.145-.419.141.001.237.029.361.089.185.088.414.28.745.49s.788.407 1.358.403a2.46 2.46 0 0 0 1.014-.21c.419-.191.684-.434.901-.571.198-.144.438-.22.683-.215.222.001.359.04.496.1.202.088.41.268.733.482.404.272.882.416 1.369.414.394.001.737-.084 1.015-.209.419-.192.684-.435.902-.572.198-.144.438-.22.683-.215.214-.003.467.087.659.193a2.35 2.35 0 0 1 .228.143l.058.044.011.009.04.032c.325.241.844.575 1.573.575h.03c.661-.013 1.225-.319 1.711-.623.219-.141.43-.295.631-.461l.166-.142 1.299 2.405H13.409l1.369-2.527zm1.401-2.586c.023.04.05.078.082.114.131.147.371.403.69.643.322.233.722.488 1.277.498.649-.018 1.09-.32 1.507-.529.41-.227.77-.377.979-.367.106.001.17.02.27.068.149.069.355.242.666.441a2.38 2.38 0 0 0 1.305.387c.375.002.708-.08.976-.202.404-.186.65-.415.838-.531s.29-.169.549-.176c.136-.004.271.023.395.08.163.069.346.227.651.431.296.198.744.399 1.29.399l.027-.001c.375.002.708-.08.976-.202.404-.185.651-.414.839-.531.194-.12.289-.169.549-.176.161-.003.373.07.536.161.067.036.132.077.194.122l.047.036.051.04a3.27 3.27 0 0 0 .61.364 2.28 2.28 0 0 0 .925.186c.593.003 1.066-.257 1.376-.518a3.39 3.39 0 0 0 .263-.245l.592 1.097c-.025.021-.05.044-.072.07l-.001-.001c-.02.025-.129.131-.268.245a5.27 5.27 0 0 1-.811.552c-.297.164-.599.257-.751.251-.403-.009-.556-.115-.872-.334a3.15 3.15 0 0 0-.483-.319c-.303-.162-.727-.34-1.244-.342-.383-.002-.72.085-.991.211-.408.193-.664.431-.883.566-.224.136-.382.213-.725.218-.221-.001-.358-.04-.495-.101-.203-.087-.41-.267-.734-.482a2.41 2.41 0 0 0-1.369-.412c-.342-.004-.68.068-.991.211-.409.193-.664.431-.884.566a1.23 1.23 0 0 1-.724.218c-.401-.006-.602-.138-.948-.378-.169-.118-.361-.263-.609-.386a2 2 0 0 0-.907-.218c-.7.009-1.253.32-1.722.563-.462.259-.863.435-1.012.419-.073-.01-.229-.068-.398-.167-.26-.146-.564-.37-.814-.577l-.5-.454c-.014-.016-.029-.031-.044-.045l.792-1.463z" fill="#00a4cd"/><path d="M26.763 27.507h1.701v1.871h-1.701z" fill="#fff"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><path d="M25.048 10.951a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z" fill="#e3000f"/><path d="M25.285 1.954l-.167-.003c-4.128-.032-7.481 2.046-9.403 5.4l-.077.136L2.237 32.334l-.073.14c-3.54 6.981 2.091 15.398 9.304 15.573l.145.002h26.812l.146-.002c7.89-.191 12.559-9.154 9.303-15.572l-.072-.139L34.4 7.487l-.076-.135c-1.839-3.209-5.346-5.301-9.039-5.398zm-.237 8.997a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z" fill="#fd0"/><path d="M24.735 13.301c.056-.105.166-.17.284-.17a.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318s-.163.158-.277.157H12.34c-.113 0-.219-.059-.277-.157s-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M22.65 22.169v1.041l1.842-2.118c.107-.124.265-.196.429-.195a.57.57 0 0 1 .429.196l5.33 6.162.001.001a.57.57 0 0 1-.058.801c-.236.203-.597.177-.802-.058l-.487-.563v3.006c-.167.014-.249.058-.396.149-.163.101-.378.301-.73.463-.234.106-.524.177-.851.176h-.023c-.476 0-.866-.175-1.123-.348-.267-.177-.427-.315-.568-.375-.095-.042-.184-.068-.344-.069a.77.77 0 0 0-.479.153c-.163.101-.378.301-.73.462-.233.106-.523.178-.85.177-.476.003-.867-.167-1.137-.338l-.58-.384c-.087-.042-.143-.058-.235-.059-.178-.009-.485.117-.834.309v-3.29l-.488.561a.57.57 0 0 1-.429.195c-.132 0-.265-.045-.373-.139-.234-.205-.259-.566-.056-.802l2.212-2.543v-2.571h1.33z" fill="#181c1b"/><path d="M14.794 33.804l.139.125c.265.233.616.515.987.753.183.121.377.226.577.314a1.71 1.71 0 0 0 .662.156c.653-.017 1.131-.331 1.589-.563.453-.248.866-.427 1.145-.419.141.001.237.029.361.089.185.088.414.28.745.49s.788.407 1.358.403c.35.004.695-.068 1.014-.21.419-.191.684-.434.901-.571.199-.144.439-.219.683-.215.222.001.359.04.496.1.202.088.41.268.733.482a2.43 2.43 0 0 0 1.369.414c.394.001.737-.084 1.015-.209.419-.192.684-.435.902-.572.199-.144.439-.219.683-.215.214-.003.467.087.659.193a2.65 2.65 0 0 1 .228.143l.058.044.011.009.04.032c.325.241.844.575 1.573.575h.03c.661-.013 1.225-.319 1.711-.623a6.49 6.49 0 0 0 .631-.461l.166-.142 1.299 2.405H13.425l1.369-2.527zm1.401-2.586c.023.04.05.078.082.114.131.147.371.403.69.643.322.233.722.488 1.277.498.649-.018 1.09-.32 1.507-.529.41-.227.77-.377.979-.367.106.001.17.02.27.068.149.069.355.242.666.441a2.38 2.38 0 0 0 1.305.387c.375.002.708-.08.976-.202.404-.186.65-.415.838-.531s.29-.169.549-.176a.91.91 0 0 1 .395.08c.163.069.346.227.651.431.296.198.744.399 1.29.399l.027-.001c.375.002.708-.08.976-.202.404-.185.651-.414.839-.531.194-.12.289-.169.549-.176.161-.003.373.07.536.161a1.76 1.76 0 0 1 .194.122l.047.036.051.04c.19.144.394.266.61.364.292.127.607.19.925.186.593.003 1.066-.257 1.376-.518.093-.076.181-.158.263-.245l.592 1.097c-.025.021-.05.044-.072.07l-.001-.001c-.02.025-.129.131-.268.245a5.2 5.2 0 0 1-.811.552c-.297.164-.599.257-.751.251-.403-.009-.556-.115-.872-.334a3.18 3.18 0 0 0-.483-.319c-.303-.162-.727-.34-1.244-.342-.383-.002-.72.085-.991.211-.408.193-.664.431-.883.566s-.382.213-.725.218c-.221-.001-.358-.04-.495-.101-.203-.087-.41-.267-.734-.482-.404-.272-.881-.416-1.369-.412a2.34 2.34 0 0 0-.991.211c-.409.193-.664.431-.884.566-.212.148-.465.224-.724.218-.401-.006-.602-.138-.948-.378-.169-.118-.361-.263-.609-.386-.281-.142-.591-.217-.907-.218-.7.009-1.253.32-1.722.563-.462.259-.863.435-1.012.419-.073-.01-.229-.068-.398-.167-.26-.146-.564-.37-.814-.577l-.5-.454c-.014-.016-.029-.031-.044-.045l.792-1.463z" fill="#00a4cd"/><path d="M26.779 27.507h1.701v1.871h-1.701z" fill="#fff"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><path d="M25.032 10.951a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875z" fill="#f18700"/><path d="M25.072 9.451h-.028c-1.246-.01-2.258.617-2.838 1.629l-.012.022L8.849 35.844l-.012.023c-1.064 2.099.628 4.63 2.796 4.682l.025.001h26.691l.024-.001c2.372-.057 3.775-2.752 2.796-4.682l-.012-.023-13.344-24.741c-.004-.008-.009-.016-.013-.023a3.28 3.28 0 0 0-2.728-1.629zm-.04 1.5a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875zm-.313 2.35a.32.32 0 0 1 .284-.17.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318s-.163.157-.277.157H12.324c-.113 0-.219-.059-.277-.157s-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M22.663 23.914v1.038l1.838-2.113c.108-.124.264-.195.428-.195s.321.071.429.196l5.319 6.149v.001c.205.237.179.594-.058.8s-.596.175-.8-.058l-.486-.562v3.235c-.143.011-.279.062-.394.148-.163.102-.378.301-.729.462-.233.106-.523.177-.849.176h-.023c-.475 0-.865-.174-1.121-.346-.266-.178-.426-.315-.566-.375-.095-.042-.185-.068-.344-.069-.225.005-.309.048-.478.152-.163.101-.377.3-.728.462-.233.106-.523.177-.849.176-.475.004-.865-.166-1.134-.337l-.579-.384c-.087-.041-.142-.057-.235-.059-.178-.008-.484.118-.832.309v-3.518l-.487.56c-.112.129-.27.195-.429.195-.132 0-.264-.046-.371-.139-.237-.206-.262-.564-.056-.801l2.207-2.538v-2.565h1.327z" fill="#181c1b"/><path d="M26.784 29.24h1.697v1.867h-1.697z" fill="#fff"/><path d="M36.543 36.283H13.457l1.248-2.304h.366a8.38 8.38 0 0 0 .876.658c.186.119.377.227.576.313.208.095.432.148.661.155.652-.016 1.128-.33 1.586-.562.452-.247.864-.426 1.142-.418.141.002.237.03.361.09.185.087.413.279.743.488s.786.406 1.355.402c.348.003.694-.068 1.012-.209.418-.19.682-.433.9-.569s.365-.21.681-.215a1.11 1.11 0 0 1 .494.1c.202.088.41.267.733.481s.783.418 1.366.412c.392.001.734-.083 1.012-.209.419-.19.683-.433.901-.569.223-.139.365-.21.681-.216.213-.002.466.088.657.194.096.052.176.105.228.143l.057.043.052.041c.323.24.841.573 1.569.573h.03c.66-.012 1.223-.317 1.708-.621.219-.141.429-.295.63-.46l.054-.045h.163l1.244 2.304z" fill="#00a4cd"/><path d="M25.032 11.14c.599.016 1.168.354 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.311-.544.855-.88 1.524-.875z" fill="none" stroke="#f18700"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.41421"><use xlink:href="#B" fill="#f18700"/><path d="M25.285 1.954l-.167-.003c-4.128-.032-7.481 2.046-9.403 5.4l-.077.136L2.237 32.334l-.073.14c-3.54 6.981 2.091 15.398 9.304 15.573l.145.002h26.812l.146-.002c7.89-.191 12.559-9.154 9.303-15.572l-.072-.139L34.4 7.487l-.076-.135c-1.839-3.209-5.346-5.301-9.039-5.398zm-.237 8.997a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z" fill="#fd0"/><path d="M24.735 13.301c.056-.105.166-.17.284-.17a.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318s-.163.158-.277.157H12.34c-.113 0-.219-.059-.277-.157s-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M22.679 23.914v1.038l1.838-2.113c.108-.124.264-.195.428-.195a.57.57 0 0 1 .429.196l5.319 6.149v.001c.205.237.179.594-.058.8s-.595.176-.8-.058l-.486-.562v3.235c-.142.011-.279.063-.394.148-.163.102-.378.301-.729.462-.233.106-.523.177-.849.176h-.023c-.475 0-.865-.174-1.121-.346-.266-.178-.426-.315-.566-.375-.095-.042-.185-.068-.344-.069-.225.005-.309.048-.478.152-.163.101-.377.3-.728.462-.233.106-.523.177-.849.176-.475.004-.865-.166-1.134-.337l-.579-.384c-.087-.041-.142-.057-.235-.059-.178-.008-.484.118-.832.309v-3.518l-.487.56c-.112.129-.27.195-.429.195-.132 0-.264-.046-.371-.139-.237-.206-.262-.564-.056-.801l2.207-2.538v-2.565h1.327z" fill="#181c1b"/><path d="M26.8 29.24h1.697v1.867H26.8z" fill="#fff"/><path d="M36.559 36.283H13.473l1.248-2.304h.366c.278.238.57.458.876.658.186.119.377.227.576.313a1.7 1.7 0 0 0 .661.155c.652-.016 1.128-.33 1.586-.562.452-.247.864-.426 1.142-.418.141.002.237.03.361.09.185.087.413.279.743.488s.786.406 1.355.402c.349.004.694-.067 1.012-.209.418-.19.682-.433.9-.569s.365-.21.681-.215a1.13 1.13 0 0 1 .494.1c.202.088.41.267.733.481.318.211.783.418 1.366.412.392.001.734-.083 1.012-.209.419-.19.683-.433.901-.569s.365-.21.681-.216c.213-.002.466.088.657.194.096.052.176.105.228.143l.057.043.052.041c.323.24.841.573 1.569.573h.03c.66-.012 1.223-.317 1.708-.621.219-.141.43-.294.63-.46l.054-.045h.163l1.244 2.304z" fill="#00a4cd"/><use xlink:href="#B" fill="none" stroke="#f18700"/><defs ><path id="B" d="M25.048 10.951a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><path d="M25.032 10.951a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875z" fill="#6f777b"/><path d="M25.072 9.451h-.028c-1.246-.01-2.258.617-2.838 1.629l-.012.022L8.849 35.844l-.012.023c-1.064 2.099.628 4.63 2.796 4.682l.025.001h26.691l.024-.001c2.372-.057 3.775-2.752 2.796-4.682l-.012-.023-13.344-24.741c-.004-.008-.009-.016-.013-.023a3.28 3.28 0 0 0-2.728-1.629zm-.04 1.5a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.67c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72a1.69 1.69 0 0 1 1.524-.875zm-.313 2.35a.32.32 0 0 1 .284-.17.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318s-.163.157-.277.157H12.324c-.113 0-.219-.059-.277-.157s-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M14.778 33.804l.139.125c.265.233.616.515.987.753.183.12.376.226.577.314.208.096.433.149.662.156.653-.017 1.131-.331 1.589-.563.453-.248.866-.427 1.145-.419.141.001.237.029.361.089.185.088.414.28.745.49s.788.407 1.358.403a2.46 2.46 0 0 0 1.014-.21c.419-.191.684-.434.901-.571.198-.144.438-.22.683-.215.222.001.359.04.496.1.202.088.41.268.733.482.404.272.882.416 1.369.414.394.001.737-.084 1.015-.209.419-.192.684-.435.902-.572.198-.144.438-.22.683-.215.214-.003.467.087.659.193a2.35 2.35 0 0 1 .228.143l.058.044.011.009.04.032c.325.241.844.575 1.573.575h.03c.661-.013 1.225-.319 1.711-.623.219-.141.43-.295.631-.461l.166-.142 1.299 2.405H13.409l1.369-2.527zm1.401-2.586c.023.04.05.078.082.114.131.147.371.403.69.643.322.233.722.488 1.277.498.649-.018 1.09-.32 1.507-.529.41-.227.77-.377.979-.367.106.001.17.02.27.068.149.069.355.242.666.441a2.38 2.38 0 0 0 1.305.387c.375.002.708-.08.976-.202.404-.186.65-.415.838-.531s.29-.169.549-.176c.136-.004.271.023.395.08.163.069.346.227.651.431.296.198.744.399 1.29.399l.027-.001c.375.002.708-.08.976-.202.404-.185.651-.414.839-.531.194-.12.289-.169.549-.176.161-.003.373.07.536.161.067.036.132.077.194.122l.047.036.051.04a3.27 3.27 0 0 0 .61.364 2.28 2.28 0 0 0 .925.186c.593.003 1.066-.257 1.376-.518a3.39 3.39 0 0 0 .263-.245l.592 1.097c-.025.021-.05.044-.072.07l-.001-.001c-.02.025-.129.131-.268.245a5.27 5.27 0 0 1-.811.552c-.297.164-.599.257-.751.251-.403-.009-.556-.115-.872-.334a3.15 3.15 0 0 0-.483-.319c-.303-.162-.727-.34-1.244-.342-.383-.002-.72.085-.991.211-.408.193-.664.431-.883.566-.224.136-.382.213-.725.218-.221-.001-.358-.04-.495-.101-.203-.087-.41-.267-.734-.482a2.41 2.41 0 0 0-1.369-.412c-.342-.004-.68.068-.991.211-.409.193-.664.431-.884.566a1.23 1.23 0 0 1-.724.218c-.401-.006-.602-.138-.948-.378-.169-.118-.361-.263-.609-.386a2 2 0 0 0-.907-.218c-.7.009-1.253.32-1.722.563-.462.259-.863.435-1.012.419-.073-.01-.229-.068-.398-.167-.26-.146-.564-.37-.814-.577-.248-.202-.458-.406-.5-.454-.014-.016-.029-.031-.044-.045l.792-1.463z" fill="#00a4cd"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><path d="M25.048 10.951a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z" fill="#6f777b"/><path d="M25.285 1.954l-.167-.003c-4.128-.032-7.481 2.046-9.403 5.4l-.077.136L2.237 32.334l-.073.14c-3.54 6.981 2.091 15.398 9.304 15.573l.145.002h26.812l.146-.002c7.89-.191 12.559-9.154 9.303-15.572l-.072-.139L34.4 7.487l-.076-.135c-1.839-3.209-5.346-5.301-9.039-5.398zm-.237 8.997a1.76 1.76 0 0 1 1.466.875l13.333 24.72c.524 1.032-.226 2.473-1.494 2.504H11.686c-1.16-.028-2.064-1.382-1.495-2.504l13.333-24.72c.304-.553.894-.891 1.524-.875z" fill="#fd0"/><path d="M24.732 13.301c.056-.105.166-.17.284-.17a.32.32 0 0 1 .284.17l12.679 23.525c.054.1.051.221-.007.318s-.163.158-.277.157H12.337a.32.32 0 0 1-.277-.157c-.058-.097-.061-.218-.007-.318l12.679-23.525z" fill="#fff"/><path d="M14.818 33.804l.139.125a8.66 8.66 0 0 0 .987.753c.184.121.377.226.577.314s.407.153.662.156c.654-.017 1.131-.331 1.59-.563.452-.248.865-.427 1.144-.419a.77.77 0 0 1 .362.089c.185.088.413.28.744.49s.788.407 1.358.403c.393.001.736-.084 1.015-.21.418-.191.683-.434.901-.571s.366-.209.683-.215c.221.001.358.04.495.1.202.088.41.268.734.482s.785.419 1.369.414c.393.001.736-.084 1.014-.209.419-.192.684-.435.903-.572.198-.143.438-.219.682-.215.214-.003.467.087.659.193.079.044.156.092.229.143l.057.044.011.009.04.032c.325.241.844.575 1.573.575h.03c.661-.013 1.225-.319 1.711-.623.241-.155.456-.316.632-.461l.165-.142 1.299 2.405H13.449l1.369-2.527zm1.364-2.586c.023.04.05.078.082.114.131.147.371.403.69.643.322.233.722.488 1.277.498.649-.018 1.09-.32 1.507-.529.41-.227.77-.377.979-.367.106.001.17.02.27.068.148.069.355.242.666.441a2.38 2.38 0 0 0 1.305.387c.375.002.708-.08.976-.202.403-.186.65-.415.838-.531.159-.117.352-.179.549-.176a.91.91 0 0 1 .395.08c.163.069.346.227.651.431.296.198.744.399 1.29.399l.027-.001c.375.002.708-.08.976-.202.404-.185.651-.414.839-.531.194-.12.289-.169.549-.176.161-.003.373.07.536.161a1.76 1.76 0 0 1 .194.122l.047.036.051.04c.189.144.394.266.61.364.292.127.607.19.925.186.593.003 1.066-.257 1.376-.518.093-.076.181-.158.263-.245l.592 1.097c-.025.021-.05.044-.072.07l-.001-.001c-.02.025-.129.131-.268.245a5.2 5.2 0 0 1-.811.552c-.297.164-.599.257-.751.251-.403-.009-.556-.115-.872-.334a3.18 3.18 0 0 0-.483-.319c-.303-.162-.727-.34-1.244-.342-.383-.002-.72.085-.991.211-.408.193-.664.431-.883.566s-.382.213-.725.218c-.221-.001-.358-.04-.495-.101-.203-.087-.41-.267-.734-.482-.404-.272-.881-.416-1.369-.412a2.34 2.34 0 0 0-.991.211c-.409.193-.665.431-.884.566-.212.148-.465.224-.724.218-.401-.006-.602-.138-.948-.378-.169-.118-.361-.263-.609-.386-.281-.142-.591-.217-.907-.218-.7.009-1.253.32-1.722.563-.462.259-.863.435-1.012.419-.074-.01-.229-.068-.398-.167-.26-.146-.564-.37-.814-.577l-.5-.454c-.014-.016-.029-.031-.044-.045l.792-1.463z" fill="#00a4cd"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="14.5" fill="#5694ca" stroke="#fff"/><path d="M22 18.109h6v2.018h-3v.968h3v2.027h-2v.968h2v1.99h-2v.968h2v2.485l-6 .885V18.109z" fill="#fff"/><g fill="none" stroke-linecap="round" stroke-linejoin="miter"><use xlink:href="#A" stroke="#5595ca" stroke-width="3.5"/><use xlink:href="#A" stroke="#fff" stroke-width="1.5"/></g><defs><path id="A" d="M19.697 30.184c.393.389.886.731 1.767.731 1.792 0 1.711-1.463 3.536-1.463s1.71 1.463 3.536 1.463c.826 0 1.24-.3 1.767-.731"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#5694ca"/><path d="M22 18.109h6v2.018h-3v.968h3v2.027h-2v.968h2v1.99h-2v.968h2v2.485l-6 .885V18.109z" fill="#fff"/><g fill="none"><use xlink:href="#B" stroke="#5595ca" stroke-width="3.5"/><use xlink:href="#B" stroke="#fff" stroke-width="1.5"/></g><defs ><path id="B" d="M19.697 30.184c.393.389.886.731 1.767.731 1.792 0 1.711-1.463 3.536-1.463s1.71 1.463 3.536 1.463c.826 0 1.24-.3 1.767-.731"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="14.5" fill="#003078" stroke="#fff"/><path d="M22 18.109h6v3.359h-6z" fill="#fff"/><g fill="none" stroke-linejoin="miter"><path d="M22.5 22.243v9.338h5v-9.384" stroke="#fff"/><g stroke-linecap="round"><use xlink:href="#B" stroke="#003078" stroke-width="3.5"/><use xlink:href="#B" stroke-width="1.5" stroke="#fff"/></g><path d="M27.5 25.581h-2m2 3h-2" stroke="#fff"/></g><defs ><path id="B" d="M19.697 22.139c.393.389.886.732 1.767.732 1.792 0 1.711-1.464 3.536-1.464s1.71 1.464 3.536 1.464c.826 0 1.24-.3 1.767-.732"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#003078"/><path d="M22 18.109h6v3.359h-6z" fill="#fff"/><g fill="none"><path d="M22.5 22.243v9.338h5v-9.384" stroke="#fff"/><g stroke-linecap="round"><use xlink:href="#B" stroke="#003078" stroke-width="3.5"/><use xlink:href="#B" stroke-width="1.5" stroke="#fff"/></g><path d="M27.5 25.581h-2m2 3h-2" stroke="#fff"/></g><defs ><path id="B" d="M19.697 22.139c.393.389.886.732 1.767.732 1.792 0 1.711-1.464 3.536-1.464s1.71 1.464 3.536 1.464c.826 0 1.24-.3 1.767-.732"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="14.5" fill="none" stroke="#fff"/><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11zm-3 4.109h6v2.018h-3v.968h3v2.027h-2v.968h2v1.99h-2v.968h2v2.485l-6 .885V18.109z" fill="#b1b4b6"/><g fill="none" stroke-linecap="round" stroke-linejoin="miter"><use xlink:href="#B" stroke="#fff" stroke-width="3.5"/><use xlink:href="#B" stroke="#b1b4b6" stroke-width="1.5"/></g><defs ><path id="B" d="M19.697 30.184c.393.389.886.731 1.767.731 1.792 0 1.711-1.463 3.536-1.463s1.71 1.463 3.536 1.463c.826 0 1.24-.3 1.767-.731"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11zm-3 4.109h6v2.018h-3v.968h3v2.027h-2v.968h2v1.99h-2v.968h2v2.485l-6 .885V18.109z" fill="#b1b4b6"/><g fill="none"><use xlink:href="#B" stroke="#fff" stroke-width="3.5"/><use xlink:href="#B" stroke="#b1b4b6" stroke-width="1.5"/></g><defs ><path id="B" d="M19.697 30.184c.393.389.886.731 1.767.731 1.792 0 1.711-1.463 3.536-1.463s1.71 1.463 3.536 1.463c.826 0 1.24-.3 1.767-.731"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.5"><g stroke="#fff"><circle cx="25" cy="25" r="14.5" fill="#5694ca"/><g fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"><use xlink:href="#B"/><use xlink:href="#B" y="4.525"/><use xlink:href="#B" y="9.05"/></g></g><defs ><path id="B" d="M19.697 20.475c.393.389.886.732 1.767.732 1.792 0 1.711-1.464 3.536-1.464s1.71 1.464 3.536 1.464c.826 0 1.24-.3 1.767-.732"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#5694ca"/><g fill="none" stroke="#fff" stroke-width="1.5"><use xlink:href="#B"/><use xlink:href="#B" y="4.525"/><use xlink:href="#B" y="9.05"/></g><defs ><path id="B" d="M19.697 20.475c.393.389.886.732 1.767.732 1.792 0 1.711-1.464 3.536-1.464s1.71 1.464 3.536 1.464c.826 0 1.24-.3 1.767-.732"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="14.5" fill="none" stroke="#fff"/><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11z" fill="#b1b4b6"/><g fill="none" stroke="#b1b4b6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"><use xlink:href="#B"/><use xlink:href="#B" y="4.525"/><use xlink:href="#B" y="9.05"/></g><defs ><path id="B" d="M19.697 20.475c.393.389.886.732 1.767.732 1.792 0 1.711-1.464 3.536-1.464s1.71 1.464 3.536 1.464c.826 0 1.24-.3 1.767-.732"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round" stroke-miterlimit="1.5"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11z" fill="#b1b4b6"/><g fill="none" stroke="#b1b4b6" stroke-width="1.5"><use xlink:href="#B"/><use xlink:href="#B" y="4.525"/><use xlink:href="#B" y="9.05"/></g><defs ><path id="B" d="M19.697 20.475c.393.389.886.732 1.767.732 1.792 0 1.711-1.464 3.536-1.464s1.71 1.464 3.536 1.464c.826 0 1.24-.3 1.767-.732"/></defs></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><g stroke="#fff"><circle cx="25" cy="25" r="14.5" fill="#5694ca"/><path d="M17.5 27.05c.931-.383 1.18-1.3 2.626-1.3 1.825 0 1.71 1.463 3.535 1.463 1.792 0 1.71-1.463 3.536-1.463s1.71 1.463 3.535 1.463c.826 0 1.241-.3 1.768-.731" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"/></g><g fill="#fff"><path d="M24.5 19.25h1v11.5h-1z"/><path d="M19.5 19.25h11v1h-11z"/></g></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#5694ca"/><path d="M17.5 27.05c.931-.383 1.18-1.3 2.626-1.3 1.825 0 1.71 1.463 3.535 1.463 1.792 0 1.71-1.463 3.536-1.463s1.71 1.463 3.535 1.463c.826 0 1.241-.3 1.768-.731" fill="none" stroke="#fff" stroke-width="1.5"/><g fill="#fff"><path d="M24.5 19.25h1v11.5h-1z"/><path d="M19.5 19.25h11v1h-11z"/></g></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><g stroke="#fff"><circle cx="25" cy="25" r="14.5" fill="#003078"/><path d="M17.5 23.55c.931-.383 1.18-1.3 2.626-1.3 1.825 0 1.71 1.463 3.535 1.463 1.792 0 1.71-1.463 3.536-1.463s1.71 1.463 3.535 1.463c.826 0 1.241-.3 1.768-.731" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"/></g><g fill="#fff"><path d="M24.5 19.25h1v11.5h-1z"/><path d="M19.5 19.25h11v1h-11z"/></g></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#003078"/><path d="M17.5 23.55c.931-.383 1.18-1.3 2.626-1.3 1.825 0 1.71 1.463 3.535 1.463 1.792 0 1.71-1.463 3.536-1.463s1.71 1.463 3.535 1.463c.826 0 1.241-.3 1.768-.731" fill="none" stroke="#fff" stroke-width="1.5"/><g fill="#fff"><path d="M24.5 19.25h1v11.5h-1z"/><path d="M19.5 19.25h11v1h-11z"/></g></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11z" fill="#b1b4b6"/><g fill="none"><circle cx="25" cy="25" r="14.5" stroke="#fff"/><path d="M17.5 27.05c.931-.383 1.18-1.3 2.626-1.3 1.825 0 1.71 1.463 3.535 1.463 1.792 0 1.71-1.463 3.536-1.463s1.71 1.463 3.535 1.463c.826 0 1.241-.3 1.768-.731" stroke="#b1b4b6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"/></g><g fill="#b1b4b6"><path d="M24.5 19.25h1v11.5h-1z"/><path d="M19.5 19.25h11v1h-11z"/></g></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11z" fill="#b1b4b6"/><path d="M17.5 27.05c.931-.383 1.18-1.3 2.626-1.3 1.825 0 1.71 1.463 3.535 1.463 1.792 0 1.71-1.463 3.536-1.463s1.71 1.463 3.535 1.463c.826 0 1.241-.3 1.768-.731" fill="none" stroke="#b1b4b6" stroke-width="1.5"/><g fill="#b1b4b6"><path d="M24.5 19.25h1v11.5h-1z"/><path d="M19.5 19.25h11v1h-11z"/></g></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11zm-4.572 8.397c.192 0 .551.032.551.003a3.52 3.52 0 0 1 3.5-3.5c1.487 0 2.759.93 3.265 2.239.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.122 2.502 2.503S30.203 25.9 28.822 25.9h-8.394c-.967 0-1.752-.785-1.752-1.752a1.75 1.75 0 0 1 1.752-1.751z" fill="#5694ca"/><circle cx="25" cy="25" r="14.5" fill="none" stroke="#fff"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11zm-4.572 8.397c.192 0 .551.032.551.003a3.52 3.52 0 0 1 3.5-3.5c1.487 0 2.759.93 3.265 2.239.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.122 2.502 2.503S30.203 25.9 28.822 25.9h-8.394c-.967 0-1.752-.785-1.752-1.752a1.75 1.75 0 0 1 1.752-1.751z" fill="#5694ca"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="14.5" fill="#003078" stroke="#fff"/><path d="M20.428 22.832c.192 0 .551.031.551.003a3.52 3.52 0 0 1 3.5-3.5 3.51 3.51 0 0 1 3.265 2.239c.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.121 2.502 2.503s-1.121 2.502-2.502 2.502h-8.394c-.967 0-1.752-.785-1.752-1.752a1.76 1.76 0 0 1 1.75-1.751z" fill="#fff"/><path d="M21.5 28.665v2m3.5-2v2m3.5-2v2" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#003078"/><path d="M20.428 22.832c.192 0 .551.031.551.003a3.52 3.52 0 0 1 3.5-3.5 3.51 3.51 0 0 1 3.265 2.239c.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.121 2.502 2.503s-1.121 2.502-2.502 2.502h-8.394c-.967 0-1.752-.785-1.752-1.752a1.76 1.76 0 0 1 1.75-1.751z" fill="#fff"/><path d="M21.5 28.665v2m3.5-2v2m3.5-2v2" fill="none" stroke="#fff" stroke-width="1.5"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="14.5" fill="#5694ca" stroke="#fff"/><path d="M20.428 22.832c.192 0 .551.031.551.003a3.52 3.52 0 0 1 3.5-3.5 3.51 3.51 0 0 1 3.265 2.239c.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.121 2.502 2.503s-1.121 2.502-2.502 2.502h-8.394c-.967 0-1.752-.785-1.752-1.752a1.76 1.76 0 0 1 1.75-1.751z" fill="#fff"/><path d="M23.25 28.665v2m3.5-2v2" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#5694ca"/><path d="M20.428 22.832c.192 0 .551.031.551.003a3.52 3.52 0 0 1 3.5-3.5 3.51 3.51 0 0 1 3.265 2.239c.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.121 2.502 2.503s-1.121 2.502-2.502 2.502h-8.394c-.967 0-1.752-.785-1.752-1.752a1.76 1.76 0 0 1 1.75-1.751z" fill="#fff"/><path d="M23.25 28.665v2m3.5-2v2" fill="none" stroke="#fff" stroke-width="1.5"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="14.5" fill="#5694ca" stroke="#fff"/><path d="M20.428 22.832c.192 0 .551.031.551.003a3.52 3.52 0 0 1 3.5-3.5 3.51 3.51 0 0 1 3.265 2.239c.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.121 2.502 2.503s-1.121 2.502-2.502 2.502h-8.394c-.967 0-1.752-.785-1.752-1.752a1.76 1.76 0 0 1 1.75-1.751z" fill="#fff"/><path d="M25 28.665v2" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="miter"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linecap="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#5694ca"/><path d="M20.428 22.832c.192 0 .551.031.551.003a3.52 3.52 0 0 1 3.5-3.5 3.51 3.51 0 0 1 3.265 2.239c.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.121 2.502 2.503s-1.121 2.502-2.502 2.502h-8.394c-.967 0-1.752-.785-1.752-1.752a1.76 1.76 0 0 1 1.75-1.751z" fill="#fff"/><path d="M25 28.665v2" fill="none" stroke="#fff" stroke-width="1.5"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11zm-4.572 8.397c.192 0 .551.032.551.003a3.52 3.52 0 0 1 3.5-3.5c1.487 0 2.759.93 3.265 2.239.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.122 2.502 2.503S30.203 25.9 28.822 25.9h-8.394c-.967 0-1.752-.785-1.752-1.752a1.75 1.75 0 0 1 1.752-1.751z" fill="#b1b4b6"/><circle cx="25" cy="25" r="14.5" fill="none" stroke="#fff"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="23.5" fill="#fd0"/><circle cx="25" cy="25" r="14" fill="#fff"/><path d="M25 11c7.678.005 13.995 6.322 14 14-.005 7.678-6.322 13.995-14 14-7.678-.005-13.995-6.322-14-14 .005-7.678 6.322-13.995 14-14zm0 3c6.032.005 10.995 4.968 11 11-.005 6.032-4.968 10.995-11 11-6.032-.005-10.995-4.968-11-11 .005-6.032 4.968-10.995 11-11zm-4.572 8.397c.192 0 .551.032.551.003a3.52 3.52 0 0 1 3.5-3.5c1.487 0 2.759.93 3.265 2.239.327-.156.692-.244 1.078-.244 1.381 0 2.502 1.122 2.502 2.503S30.203 25.9 28.822 25.9h-8.394c-.967 0-1.752-.785-1.752-1.752a1.75 1.75 0 0 1 1.752-1.751z" fill="#b1b4b6"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="7.5" fill="#5694ca" stroke="#fff"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="16.5" fill="#fd0"/><circle cx="25" cy="25" r="7" fill="#5694ca"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="7.5" fill="#003078" stroke="#fff"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="16.5" fill="#fd0"/><circle cx="25" cy="25" r="7" fill="#003078"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="7.5" fill="#626a6e" stroke="#fff"/><circle cx="25" cy="25" r="7" fill="#fdfdfd"/><path d="M25 18c3.838.005 6.995 3.162 7 7-.005 3.838-3.162 6.995-7 7-3.838-.005-6.995-3.162-7-7 .005-3.838 3.162-6.995 7-7zm0 3a4.02 4.02 0 0 1 4 4 4.02 4.02 0 0 1-4 4 4.02 4.02 0 0 1-4-4 4.02 4.02 0 0 1 4-4z" fill="#b1b4b6"/></svg>',
//   '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill-rule="evenodd" stroke-linejoin="round"><circle cx="25" cy="25" r="16.5" fill="#fd0"/><circle cx="25" cy="25" r="7" fill="#fdfdfd"/><path d="M25 18c3.838.005 6.995 3.162 7 7-.005 3.838-3.162 6.995-7 7-3.838-.005-6.995-3.162-7-7 .005-3.838 3.162-6.995 7-7zm0 3a4.02 4.02 0 0 1 4 4 4.02 4.02 0 0 1-4 4 4.02 4.02 0 0 1-4-4 4.02 4.02 0 0 1 4-4z" fill="#b1b4b6"/></svg>'
// ]

// const styleCache = {
//   severe: createIconStyle({ src: graphics[0], zIndex: 5 }),
//   severeSelected: createIconStyle({ src: graphics[1], zIndex: 10 }),
//   warning: createIconStyle({ src: graphics[2], zIndex: 4 }),
//   warningSelected: createIconStyle({ src: graphics[3], zIndex: 10 }),
//   alert: createIconStyle({ src: graphics[4], zIndex: 3 }),
//   alertSelected: createIconStyle({ src: graphics[5], zIndex: 10 }),
//   targetArea: createIconStyle({ src: graphics[6], zIndex: 1 }),
//   targetAreaSelected: createIconStyle({ src: graphics[7], zIndex: 10 }),
//   // River
//   river: createIconStyle({ src: graphics[8], zIndex: 2 }),
//   riverSelected: createIconStyle({ src: graphics[9], zIndex: 10 }),
//   riverHigh: createIconStyle({ src: graphics[10], zIndex: 3 }),
//   riverHighSelected: createIconStyle({ src: graphics[11], zIndex: 10 }),
//   riverError: createIconStyle({ src: graphics[12], zIndex: 1 }),
//   riverErrorSelected: createIconStyle({ src: graphics[13], zIndex: 10 }),
//   // Tide
//   tide: createIconStyle({ src: graphics[14], zIndex: 2 }),
//   tideSelected: createIconStyle({ src: graphics[15], zIndex: 10 }),
//   tideError: createIconStyle({ src: graphics[16], zIndex: 1 }),
//   tideErrorSelected: createIconStyle({ src: graphics[17], zIndex: 10 }),
//   // Groundwater
//   ground: createIconStyle({ src: graphics[18], zIndex: 2 }),
//   groundSelected: createIconStyle({ src: graphics[19], zIndex: 10 }),
//   groundHigh: createIconStyle({ src: graphics[20], zIndex: 3 }),
//   groundHighSelected: createIconStyle({ src: graphics[21], zIndex: 10 }),
//   groundError: createIconStyle({ src: graphics[22], zIndex: 1 }),
//   groundErrorSelected: createIconStyle({ src: graphics[23], zIndex: 10 }),
//   // Rainfall
//   rain: createIconStyle({ src: graphics[24], zIndex: 3 }),
//   rainSelected: createIconStyle({ src: graphics[25], zIndex: 10 }),
//   rainHeavy: createIconStyle({ src: graphics[26], zIndex: 3 }),
//   rainHeavySelected: createIconStyle({ src: graphics[27], zIndex: 10 }),
//   rainModerate: createIconStyle({ src: graphics[28], zIndex: 3 }),
//   rainModerateSelected: createIconStyle({ src: graphics[29], zIndex: 10 }),
//   rainLight: createIconStyle({ src: graphics[30], zIndex: 3 }),
//   rainLightSelected: createIconStyle({ src: graphics[31], zIndex: 10 }),
//   rainError: createIconStyle({ src: graphics[32], zIndex: 3 }),
//   rainErrorSelected: createIconStyle({ src: graphics[33], zIndex: 10 }),
//   // Measurements
//   measurement: createIconStyle({ src: graphics[34], zIndex: 2 }),
//   measurementSelected: createIconStyle({ src: graphics[35], zIndex: 10 }),
//   measurementAlert: createIconStyle({ src: graphics[36], zIndex: 3 }),
//   measurementAlertSelected: createIconStyle({ src: graphics[37], zIndex: 10 }),
//   measurementError: createIconStyle({ src: graphics[38], zIndex: 1 }),
//   measurementErrorSelected: createIconStyle({ src: graphics[39], zIndex: 10 }),
//   text: createTextStyle(),
//   textLarge: createTextStyle({ font: 'Bold 16px GDS Transport, Arial, sans-serif', offsetY: -13, radius: 3 })
// }
