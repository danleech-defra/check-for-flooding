const db = require('./db')
const pgp = require('pg-promise')()
const moment = require('moment-timezone')
const axios = require('axios')

module.exports = async () => {
  // Get data from API
  const start = moment()
  console.log(`--> Update started at ${start.format('HH:mm:ss')}`)
  const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?latest'
  const response = await axios.get(uri).then(response => { return response })
  const readings = []
  if (response.status === 200 && response.data && response.data.items) {
    const measureTypes = ['downstage', 'stage', 'tidal', 'groundwater', 'rainfaill']
    const items = response.data.items.filter(x => measureTypes.some(string => x.measure.includes(string)))
    for (const item of items) {
      // Some measures have an array of numbers???
      if (typeof item.value !== 'number') {
        continue
      }
      readings.push({
        id: item['@id'].substring(item['@id'].lastIndexOf('readings/') + 9),
        measure_id: item.measure.substring(item.measure.lastIndexOf('/') + 1),
        value: item.value,
        datetime: item.dateTime
      })
    }
  }
  console.log(`--> Received ${readings.length} readings`)
  const cs = new pgp.helpers.ColumnSet(['id', 'measure_id', 'value', 'datetime'], { table: 'reading' })
  const query = pgp.helpers.insert(readings, cs) + ' ON CONFLICT (id) DO NOTHING'
  await db.none(query)
  console.log('--> Updated readings')
  // Need a beter delete process
  await db.any(`
    DELETE FROM reading WHERE datetime < NOW() - interval '2 days';`
  )
  console.log('--> Deleted old readings')
  // Update log
  await db.query('INSERT INTO log (datetime, message) values($1, $2)', [
    moment().format(), `Updated ${readings.length} readings`
  ])
}
