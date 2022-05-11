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
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning.name, warning.severity, warning.raised_date AT TIME ZONE '+00' AS raised_date
    FROM warning JOIN flood_warning_areas ON flood_warning_areas.fws_tacode = warning.id UNION
    SELECT warning.id, ST_AsGeoJSON(ST_Centroid(geom))::JSONB AS geometry, warning.name, warning.severity, warning.raised_date AT TIME ZONE '+00' AS raised_date
    FROM warning JOIN flood_alert_areas ON flood_alert_areas.fws_tacode = warning.id;
    `)
    const features = []
    response.forEach(item => {
      features.push({
        type: 'Feature',
        id: item.id,
        geometry: item.geometry,
        properties: {
          name: item.name,
          severity: Number(item.severity),
          issuedDate: item.raised_date,
          type: 'TA'
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
      SELECT station_id, rloi_id, lon, lat,
      CASE
      WHEN type = 'river' AND is_multi_stage THEN 'M'
      WHEN type = 'river' AND NOT is_multi_stage THEN 'S'
      WHEN type = 'groundwater' THEN 'G'
      WHEN type = 'tide' THEN 'C'
      WHEN type = 'rainfall' THEN 'R'
      ELSE NULL END AS type,
      is_wales, initcap(latest_state) AS latest_state, status, name, river_name, hydrological_catchment_id, hydrological_catchment_name, initcap(latest_trend) AS latest_trend, latest_height, rainfall_1hr, rainfall_6hr, rainfall_24hr, latest_datetime AT TIME ZONE '+00' AS latest_datetime, level_high, level_low, station_up, station_down
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
          type: item.type,
          name: item.name,
          river: item.river_name,
          catchmentId: item.hydrological_catchment_id,
          catchmentName: item.hydrological_catchment_name,
          status: item.status,
          value: item.latest_height,
          value1hr: item.rainfall_1hr,
          value6hr: item.rainfall_6hr,
          value24hr: item.rainfall_24hr,
          trend: item.trend,
          valueDate: item.latest_datetime,
          percentile5: item.level_high,
          percentile95: item.level_low,
          up: item.station_up,
          down: item.station_down,
          atrisk: item.latest_state === 'High',
          iswales: item.is_wales
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
