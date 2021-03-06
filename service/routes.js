const express = require('express')
const router = express.Router()
const warningServices = require('./warning')
const riverServices = require('./river')
const stationServices = require('./station')
const outlookServices = require('./outlook')
const targetAreaServices = require('./target-area')
const mapServices = require('./map')
const fs = require('fs')
const path = require('path')

//
// Warnings
//

// Get all warnings
router.get('/service/warnings', async (req, res, next) => {
  try {
    res.status(200).json(await warningServices.getWarnings())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get warnings that intersect a lon lat bbox
router.get('/service/warnings/:x1/:y1/:x2/:y2', async (req, res, next) => {
  try {
    const { x1, y1, x2, y2 } = req.params
    res.status(200).json(await warningServices.getWarningsWithinBbox([x1, y1, x2, y2]))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Target area
//

// Get a single target area with all its details
router.get('/service/target-area/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    res.status(200).json(await targetAreaServices.getTargetArea(id))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Rivers
//

// Get all rivers
router.get('/service/rivers', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getRivers())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get single river
router.get('/service/river/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getRiverBySlug(req.params.slug))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get all rivers that contain slug
router.get('/service/rivers/:slug', async (req, res, next) => {
  // We dont want long lists of rivers, brooks etc
  const broadSearches = ['river', 'brook', 'stream']
  if (broadSearches.includes(req.params.slug)) {
    res.status(200).json([])
  } else {
    try {
      res.status(200).json(await riverServices.getRiversLikeSlug(req.params.slug))
    } catch (err) {
      res.status(500)
      console.log(err)
    }
  }
})

// Get a single river and stations that is like the slug
router.get('/service/river-detail/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await riverServices.getRiverDetailBySlug(req.params.slug))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Stations
//

// Get a single station with all its details
router.get('/service/station/:id', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStation(req.params.id))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get stations within lon lat bbox
router.get('/service/stations-within/:x1/:y1/:x2/:y2', async (req, res, next) => {
  try {
    const { x1, y1, x2, y2 } = req.params
    res.status(200).json(await stationServices.getStationsWithinBbox([x1, y1, x2, y2]))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// Get stations by river slug
router.get('/service/stations-by-river/:slug', async (req, res, next) => {
  try {
    res.status(200).json(await stationServices.getStationsByRiverSlug(req.params.slug))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

//
// Outlook
//

router.get('/service/outlook', async (req, res, next) => {
  try {
    res.status(200).json(await outlookServices.getOutlook())
  } catch (err) {
    res.sendStatus(500)
    console.log(err)
  }
})

//
// Maps
//

// GeoJSON layers
router.get('/service/geojson/:type', async (req, res, next) => {
  const type = req.params.type
  try {
    if (['river', 'tide', 'groundwater', 'rainfall'].includes(type)) {
      const code = type === 'river' ? 's,m' : type === 'tide' ? 'c' : type === 'groundwater' ? 'g' : 'r'
      res.status(200).json(await mapServices.getStationsGeoJSON(code))
    } else if (type === 'warnings') {
      res.status(200).json(await mapServices.getWarningsGeoJSON())
    } else if (type === 'outlook') {
      res.status(200).json(await mapServices.getOutlookGeoJSON())
    } else if (type === 'places') {
      res.status(200).json(await mapServices.getPlacesGeoJSON())
    } else {
      res.sendStatus(404)
    }
  } catch (err) {
    res.sendStatus(500)
    console.log(err)
  }
})

// Vector tiles
router.get('/tiles/target-areas/:z/:x/:y.pbf', async (req, res, next) => {
  const { x, y, z } = req.params
  fs.readFile(`${path.join(__dirname)}/vt/${z}/${x}/${y}.pbf`, (err, data) => {
    if (err) {
      res.status(204)
    } else {
      // set the content type based on the file
      res.setHeader('Content-Type', 'application/x-protobuf')
      res.setHeader('Content-Encoding', 'gzip')
      res.write(data, 'binary')
    }
    res.end(null, 'binary')
  })
})

// GeoJSON warning areas used with TippeCanoe (creating vector tiles)
router.get('/service/flood-warning-areas-geojson', async (req, res, next) => {
  try {
    res.status(200).json(await mapServices.getTargetAreasGeoJSON('warning'))
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

// GeoJSON alert areas used with TippeCanoe (creating vector tiles)
router.get('/service/target-areas-geojson', async (req, res, next) => {
  try {
    res.status(200).json(await mapServices.getTargetAreasGeoJSON())
  } catch (err) {
    res.status(500)
    console.log(err)
  }
})

module.exports = router
