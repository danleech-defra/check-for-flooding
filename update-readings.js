const dotenv = require('dotenv')
const https = require('https')
dotenv.config({ path: './.env' })
const db = require('./service/db')
const moment = require('moment-timezone')
const axios = require('axios')

axios.defaults.timeout = 30000
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true })

const updateReadings = async () => {
  // Get data from API
  const start = moment()
  console.log(`= Started at ${start.format('HH:mm:ss')}`)
  const uri = 'http://environment.data.gov.uk/flood-monitoring/data/readings?latest'
  const response = await axios.get(uri).then(response => { return response })
  const readings = []
  if (response.status === 200 && response.data && response.data.items) {
    const items = response.data.items
    for (const item of items) {
      // Some measures have an array of numbers???
      if (typeof item.value !== 'number') {
        continue
      }
      readings.push({
        measureId: item.measure.substring(item.measure.lastIndexOf('/') + 1),
        value: item.value,
        dateTime: item.dateTime
      })
    }
  }
  console.log('= Data received')
  // Update oldest record with latest
  const errors = []
  const promises = []
  const updated = []
  for (const [i, reading] of readings.entries()) {
    promises.push(new Promise((resolve, reject) => {
      db.query(`
        UPDATE reading
        SET value = $2, datetime = $3
        WHERE measure_id = $1
        AND $3 > (SELECT MAX(datetime) 
        FROM reading WHERE reading.measure_id = $1)
        AND datetime = (SELECT MIN(datetime) 
        FROM reading WHERE reading.measure_id = $1)`, [
        reading.measureId, reading.value, reading.dateTime
      ], (err, result) => {
        if (err) {
          console.log(err)
          errors.push(reading.measureId)
        } else if (result) {
          if (result.rowCount > 0) {
            updated.push(reading.measureId)
          }
        }
        const percentage = `${((100 / readings.length) * (i + 1)).toFixed(2).padStart(4, '0')}%`
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(`= Updating readings ${percentage}: Updated (${updated.length}), Errors (${errors.length})`)
        resolve(i)
      })
    }))
  }
  await Promise.all(promises).then(() => {
    const end = moment()
    const duration = end.diff(start)
    console.log(`\n= Finished at ${end.format('HH:mm:ss')} (${moment.utc(duration).format('HH:mm:ss')})}`)
  })
  // Update log
  db.query('INSERT INTO log (datetime, message) values($1, $2)', [
    moment().format(), `Updated readings: Updates ${updated.length}, Errors ${errors.length}`
  ])
}

updateReadings()
