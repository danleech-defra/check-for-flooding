const db = require('./db')

module.exports = {
  // Used on list page
  getStationsWithinBbox: async (bbox) => {
    // Convert type names to chars
    const response = await db.query(`
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN station.type = 'm' THEN 1 ELSE 0 END AS is_multi,
    CASE WHEN river.name is NOT NULL THEN river.name ELSE null END AS river_name,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE null END AS river_display,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    station.river AS river_wiski_name,
    CASE
    WHEN station.type_name = 'tide' AND river.id is NULL THEN 2
    WHEN station.type_name = 'groundwater' THEN 3
    WHEN station.type_name = 'rainfall' THEN 4
    ELSE 1 END AS group_order,
    CASE
    WHEN station.type_name = 'tide' AND river.id is NULL THEN 'sea'
    WHEN station.type_name = 'groundwater' THEN 'groundwater'
    WHEN station.type_name = 'rainfall' THEN 'rainfall'
    ELSE 'river' END AS group_type,
    river_station.order AS station_order,
    0 AS is_downstream,
    CASE
    WHEN (measure_id IS NOT NULL OR measure_downstream_id IS NOT NULL OR measure_rainfall_id IS NOT NULL) THEN true
    ELSE false END AS has_detail
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE ST_Contains(ST_MakeEnvelope($1, $2, $3, $4,4326),station.geom))
    UNION ALL
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN station.type = 'm' THEN 1 ELSE 0 END AS is_multi,
    CASE WHEN river.name is NOT NULL THEN river.name ELSE null END AS river_name,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE null END AS river_display,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    station.river AS river_wiski_name,
    CASE
    WHEN station.type_name = 'tide' AND river.id is NULL THEN 2
    WHEN station.type_name = 'groundwater' THEN 3
    WHEN station.type_name = 'rainfall' THEN 4
    ELSE 1 END AS group_order,
    CASE
    WHEN station.type_name = 'tide' AND river.id is NULL THEN 'sea'
    WHEN station.type_name = 'groundwater' THEN 'groundwater'
    WHEN station.type_name = 'rainfall' THEN 'rainfall'
    ELSE 'river' END AS group_type,
    river_station.order AS station_order,
    1 AS is_downstream,
    CASE
    WHEN (measure_id IS NOT NULL OR measure_downstream_id IS NOT NULL OR measure_rainfall_id IS NOT NULL) THEN true
    ELSE false END AS has_detail
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE (ST_Contains(ST_MakeEnvelope($1, $2, $3, $4,4326),station.geom)) AND station.type = 'm')
    ORDER BY group_order, river_name, station_order, is_downstream;   
    `, bbox)
    return response.rows || {}
  },

  // Used on list page
  getStationsByRiverSlug: async (slug) => {
    // Convert type names to chars
    const response = await db.query(`
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN river.name is NOT NULL THEN river.name ELSE null END AS river_name,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE null END AS river_display,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    river_station.order AS station_order,
    0 AS is_downstream,
    CASE
    WHEN (station.measure_id IS NOT NULL OR station.measure_downstream_id IS NOT NULL) THEN true
    ELSE false END AS has_detail
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE river.slug LIKE $1 OR river.slug LIKE $2 OR river.slug LIKE $3)
    UNION ALL
    (SELECT station.name,
    station.id,
    station.state,
    station.value,
    station.value_downstream,
    station.value_1hr,
    station.value_6hr,
    station.value_24hr,
    station.value_date,
    station.type_name AS type,
    CASE WHEN river.name is NOT NULL THEN river.name ELSE null END AS river_name,
    CASE WHEN river.display is NOT NULL THEN river.display ELSE null END AS river_display,
    CASE WHEN river.display is NOT NULL THEN river.slug ELSE NULL END AS river_slug,
    river_station.order AS station_order,
    1 AS is_downstream,
    CASE
    WHEN (station.measure_id IS NOT NULL OR station.measure_downstream_id IS NOT NULL) THEN true
    ELSE false END AS has_detail
    FROM river
    RIGHT JOIN river_station ON river_station.slug = river.slug
    RIGHT JOIN station ON river_station.station_id = station.id
    WHERE (river.slug LIKE $1 OR river.slug LIKE $2 OR river.slug LIKE $3) AND station.type = 'm')
    ORDER BY river_name, station_order, is_downstream
    `, [`%-${slug}%`, `%${slug}-%`, slug])
    // Address this in SQL/Materialised view
    if (response.rows && [...new Set(response.rows.map(item => item.river_slug))].length > 1) {
      response.rows = []
    }
    return response.rows || []
  },

  // Used on detail page
  getStation: async (id, stage) => {
    const response = await db.query(`
    SELECT
    station.id,
    station.name,
    station.wiski_id,
    station.type_name AS type,
    CASE
    WHEN station.type = 'm' THEN true
    ELSE false
    END AS is_multi,
    CASE
    WHEN $2 = 'downstream' AND station.type = 'm' THEN 'downstream'
    ELSE 'upstream' END AS stage,
    river.display AS river,
    station.river AS river_name_wiski,
    station.state,
    station.status,
    CASE
    WHEN $2 = 'downstream' AND station.type = 'm' THEN NULL
    ELSE station.percentile_95 END AS range_bottom,
    CASE
    WHEN $2 = 'downstream' AND station.type = 'm' THEN NULL
    ELSE station.percentile_5 END AS range_top,
    CASE
    WHEN $2 = 'downstream' AND station.type = 'm' THEN NULL
    ELSE station.value END AS height,
    CASE
    WHEN $2 = 'downstream' AND station.type = 'm' THEN station.value_downstream
    ELSE station.value END AS height,
    station.value_date AS date,
    station.value_status AS value_status,
    station.up AS upstream_id,
    station.down AS downstream_id,
    CONCAT(station.lon,',',station.lat) AS centroid,
    station.is_wales,
    CASE WHEN $2 = 'downstream' THEN station.measure_downstream_id ELSE station.measure_id END AS measure_id
    FROM station
    LEFT JOIN river_station ON river_station.station_id = station.id
    LEFT JOIN river ON river.slug = river_station.slug
    WHERE lower(station.id) = lower($1)
    `, [id, stage])
    return response.rows[0]
  },

  // Used on detail page
  getStationRain: async (id) => {
    const response = await db.query(`
    SELECT
    station.id,
    station.type_name AS type,
    station.name,
    station.value_1hr AS rainfall_1hr,
    station.value_6hr AS rainfall_6hr,
    station.value_24hr AS rainfall_24hr,
    station.value_date AS date,
    CONCAT(station.lon,',',station.lat) AS centroid,
    station.is_wales,
    station.measure_rainfall_id AS measure_id
    FROM station
    WHERE lower(station.id) = lower($1)
    `, [id])
    return response.rows[0]
  }
}
