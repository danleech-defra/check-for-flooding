const db = require('./db')
const places = require('./data/places.json')
const outlookServices = require('./outlook')
const OutlookGeoJSON = require('./models/outlook')

module.exports = {
  getPlacesGeoJSON: async () => {
    return places
  },
  getOutlookGeoJSON: async () => {
    const outlook = await outlookServices.getOutlook()
    return new OutlookGeoJSON(outlook)
  },
  getWarningsGeoJSON: async () => {
    const response = await db.query(`
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning.name,
    CASE WHEN warning.severity = 1 THEN 'severe' WHEN warning.severity = 2 THEN 'warning' WHEN warning.severity = 3 THEN 'alert' ELSE 'removed' END AS status,
    warning.raised_date AT TIME ZONE '+00' AS raised_date
    FROM warning JOIN flood_warning_areas ON flood_warning_areas.fws_tacode = warning.id UNION
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning.name,
    CASE WHEN warning.severity = 1 THEN 'severe' WHEN warning.severity = 2 THEN 'warning' WHEN warning.severity = 3 THEN 'alert' ELSE 'removed' END AS status,
    warning.raised_date AT TIME ZONE '+00' AS raised_date
    FROM warning JOIN flood_alert_areas ON flood_alert_areas.fws_tacode = warning.id;
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        // id: item.id,
        geometry: item.geometry,
        properties: {
          id: item.id,
          type: 'targetarea',
          name: item.name,
          status: item.status,
          issuedDate: item.raised_date
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getStationsGeoJSON: async () => {
    const response = await db.query(`
      SELECT station_id,
      CASE WHEN type = 'tide' AND river_slug IS NOT NULL THEN 'river' WHEN type = 'tide' AND river_slug IS NULL THEN 'sea' WHEN type = 'rainfall' THEN 'rain' ELSE type END AS type,
      rloi_id, lon, lat, is_multi_stage, measure_type,
      is_wales, latest_state,
      CASE
      WHEN latest_state = 'high' THEN 'withrisk'
      WHEN type = 'rainfall' AND rainfall_24hr = 0 THEN 'norisk'
      WHEN status != 'active' THEN 'error'
      ELSE 'default' END AS status,
      name, river_name, hydrological_catchment_id, hydrological_catchment_name, latest_trend, latest_height, rainfall_1hr, rainfall_6hr, rainfall_24hr, latest_datetime AT TIME ZONE '+00' AS latest_datetime, level_high, level_low, station_up, station_down
      FROM measure_with_latest;
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        id: `stations.${item.type === 'R' ? item.station_id : item.rloi_id}`,
        geometry: {
          type: 'Point',
          coordinates: [item.lon, item.lat]
        },
        properties: {
          id: item.station_id,
          type: item.type,
          name: item.name,
          river: item.river_name,
          status: item.status,
          value1hr: item.rainfall_1hr,
          value6hr: item.rainfall_6hr,
          value24hr: item.rainfall_24hr,
          latestHeight: item.latest_height,
          latestTrend: item.trend,
          latestState: item.latest_state,
          latestDate: item.latest_datetime,
          stationUp: item.station_up,
          stationDown: item.station_down,
          isMultiStage: item.is_multi_stage,
          isDownstage: item.measure_type === 'downstage'
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  },
  getTargetAreasGeoJSON: async () => {
    const response = await db.query(`
    SELECT 5000 + id AS id, ST_AsGeoJSON(geom)::JSONB AS geometry, fws_tacode
    FROM flood_alert_areas
    UNION ALL
    SELECT id, ST_AsGeoJSON(geom)::JSONB AS geometry, fws_tacode
    FROM flood_warning_areas
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        id: item.id,
        geometry: item.geometry,
        properties: {
          fws_tacode: item.fws_tacode
        }
      })
    })
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    }
    return geoJSON
  }
}
