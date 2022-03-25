//
// Seed readings table from public API
// Warning: Takes approx 15-20 minutes
//

const dotenv = require('dotenv')
const https = require('https')
dotenv.config({ path: './.env' })
const db = require('./service/db')
const moment = require('moment-timezone')
const axios = require('axios')
// const cron = require('node-cron')

// cron.schedule('*/1 * * * * ', async () => {
//   console.log('running a task every one minute')
// })

axios.defaults.timeout = 30000
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true })

const seedReadings = async () => {
  // Get list of measure Id's
  const response = await db.query(`
    (SELECT
    measure_id AS id,
    CASE
    WHEN measure_id LIKE '%raingauge-t-15_min-mm%' THEN 96
    WHEN measure_id LIKE '%raingauge-t-1_h-mm%' THEN 24
    ELSE 2 END AS limit
    FROM station WHERE ref != '')
    UNION ALL
    (SELECT
    measure_downstream_id AS id,
    2 AS limit
    FROM station WHERE measure_id LIKE '%downstage%' AND ref != '')
    `)
  // Get data from API (approx 3k plus endpoints)
  const measures = response.rows.slice(0, 10)
  const readings = []
  const errors = []
  const start = moment()
  let end, duration
  console.log(`= Started at ${start.format('HH:mm:ss')}`)
  for (const [i, measure] of measures.entries()) {
    const uri = `http://environment.data.gov.uk/flood-monitoring/id/measures/${measure.id}/readings?_sorted&_limit=${measure.limit}`
    const percentage = `${((100 / measures.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
    let response
    try {
      response = await axios.get(uri) // .then(response => { return response })
    } catch (err) {
      errors.push(measure.id)
      continue
    }
    if (response.status === 200 && response.data && response.data.items) {
      const items = response.data.items
      for (const item of items) {
        readings.push({
          measureId: item.measure.substring(item.measure.lastIndexOf('/') + 1),
          value: item.value,
          dateTime: item.dateTime
        })
      }
    } else {
      errors.push(measure.id)
    }
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    end = moment()
    duration = end.diff(start)
    process.stdout.write(`= Getting measures ${moment.utc(duration).format('HH:mm:ss')} ${percentage} ${String(i + 1)} of ${measures.length} | Readings: Success (${readings.length}), Errors (${errors.length}) `)
  }
  // Truncate table and insert records
  process.stdout.write('\n')
  await db.query('TRUNCATE table reading')
  const insertErrors = []
  const insertPromises = []
  const inserted = []
  for (const [i, reading] of readings.entries()) {
    const percentage = `${((100 / readings.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
    insertPromises.push(new Promise((resolve, reject) => {
      db.query('INSERT INTO reading (measure_id, value, datetime) values($1, $2, $3)', [
        reading.measureId, reading.value, reading.dateTime
      ], (err, result) => {
        if (err) {
          insertErrors.push(reading.measureId)
        } else if (result) {
          inserted.push(reading.measureId)
        }
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        end = moment()
        duration = end.diff(start)
        process.stdout.write(`= Inserting readings ${percentage}: Success (${inserted.length}), Errors (${insertErrors.length})`)
        resolve(i)
      })
    }))
  }
  await Promise.all(insertPromises).then(() => {
    process.stdout.write('\n')
    console.log('= Finished')
    // Update log
    db.query('INSERT INTO log (datetime, message) values($1, $2)', [
      moment().format(), `Seeded readings: Success ${inserted.length}, Errors ${insertErrors.length}`
    ])
  })
}

seedReadings()
