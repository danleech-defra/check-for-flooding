const express = require('express')
const utils = require('../utils')
const riverServices = require('../services/river')
const locationServices = require('../services/location')
const levelServices = require('../services/level')
const router = express.Router()
const River = require('../models/river')
const Level = require('../models/level')
const Place = require('../models/place')

// Get levels
router.get('/levels', async (req, res) => {
  const query = decodeURI(req.query.river || req.query.place)
  const slug = query ? utils.getSlug(query) : ''
  const queryType = req.query.river ? 'river' : (req.query.place ? 'place' : 'none')

  if (queryType === 'river') {
    // We a river query
    const response = await riverServices.getRiverDetail(slug)
    if (response.status === 200) {
      const levels = []
      let river = {}
      if (response.data && response.data.length) {
        river = new River(response.data[0])
        response.data.forEach((item, index) => {
          if (index >= 1) {
            const level = new Level(item)
            levels.push(level)
          }
        })
      }
      const model = {
        query: query,
        numLevels: levels.length,
        isRiver: true,
        river: river,
        levels: levels
      }
      return res.render('levels', { model })
    } else {
      // Return 500 error
    }
  } else if (queryType === 'place') {
    // A place query
    let response = await locationServices.getLocationByQuery(query)
    let place = {}
    // Get place
    if (response.status === 200) {
      if (response.data && response.data.result) {
        // We have a valid location
        place = new Place(response.data.result)
      } else {
        // Return 404
        return res.status(404).render('404')
      }
    } else {
      // Return 500 error
      return res.status(503).render('500')
    }
    // Get levels
    response = await levelServices.getLevelsWithin(place.bboxBuffered)
    let numLevels
    let levels
    if (response.data) {
      levels = utils.groupBy(response.data, 'group_name')
      Object.entries(levels).forEach(([key, value]) => {
        value.forEach((item, index) => {
          levels[key][index] = new Level(item)
        })
      })
      numLevels = response.data.length
    }
    const model = {
      query: query,
      numLevels: numLevels,
      isPlace: true,
      place: place,
      levels: levels
    }
    return res.render('levels', { model })
  } else {
    // No query
    res.render('levels')
  }
})

// Get levels by location
// router.get('/levels/location/:location', async (req, res) => {
//   const slug = req.params.location.toLowerCase()
//   let response = await locationServices.getLocation(slug)
//   const model = {}

//   // Get place
//   if (response.status === 200) {
//     if (response.data && response.data.result) {
//       // We have a valid location
//       model.place = new Place(response.data.result)
//     } else {
//       // Return 404
//       return res.status(404).render('404')
//     }
//   } else {
//     // Return 500 error
//     return res.status(503).render('500')
//   }

//   // Get levels
//   if (model.place) {
//     response = await levelServices.getLevelsWithin(model.place.bboxBuffered)
//     if (response.data) {
//       const levels = utils.groupBy(response.data, 'group_name')
//       Object.entries(levels).forEach(([key, value]) => {
//         value.forEach((item, index) => {
//           levels[key][index] = new Level(item)
//         })
//       })
//       model.numLevels = response.data.length
//       model.levels = levels
//     }
//   }

//   return res.render('levels', { model })
// })

// Get levels by river
// router.get('/levels', async (req, res) => {
//   const slug = req.params.river.toLowerCase()
//   const response = await riverServices.getRiverDetail(slug)
//   if (response.status === 200) {
//     if (response.data) {
//       // We have a valid route
//       const river = new River(response.data[0])
//       const levels = []
//       response.data.forEach((item, index) => {
//         if (index >= 1) {
//           const level = new Level(item)
//           levels.push(level)
//         }
//       })
//       const model = {
//         river: river,
//         levels: levels
//       }
//       return res.render('levels', { model })
//     } else {
//       // Return 404
//       return res.status(404).render('404')
//     }
//   } else {
//     // Return 500 error
//   }
// })

// Search levels
router.post('/levels', async (req, res) => {
  const query = req.body.location
  const model = { query: query }
  if (query === '') {
    model.isError = true
    return res.render('levels', { model })
  }

  // Check places
  const places = []
  const locationResponse = await locationServices.getLocationsByQuery(model.query)
  if (locationResponse.status === 200) {
    if (locationResponse.data.results && locationResponse.data.results.length) {
      // We have some matches
      locationResponse.data.results.forEach(result => { places.push(new Place(result.GAZETTEER_ENTRY)) })
    }
  } else {
    // Log 500 error
    console.log('500 error: Location')
  }
  model.places = places

  // Check rivers
  let rivers = []
  const riverResponse = await riverServices.getRivers(model.query)
  if (riverResponse.status === 200) {
    rivers = riverResponse.data
  } else {
    // Log 500 error
    console.log('500 error: Rivers')
  }
  model.rivers = rivers

  if (!places.length && !rivers.length) {
    // We have no matches
    model.isNoResults = true
    res.render('levels', { model })
  } else if (places.length === 1 && !rivers.length) {
    // We have a single place
    res.redirect(`/levels?place=${encodeURI(query)}`)
  } else if (rivers.length === 1 && !places.length) {
    // We have a single river
    res.redirect(`/levels?river=${encodeURI(query)}`)
  } else if (places.filter(place => place.type !== 'postcode').length === 0 && !rivers.length) {
    // We have too many full postcodes
    model.isError = true
    model.isErrorPostcode = true
    res.render('levels', { model })
  } else {
    // We have multiple matches
    if (places.filter(place => place.type !== 'postcode').length === 0) {
      // We dont want to display hundreds of full postcodes
      model.places = []
    }
    model.isMultipleMatch = true
    res.render('levels', { model })
  }
})

module.exports = router
