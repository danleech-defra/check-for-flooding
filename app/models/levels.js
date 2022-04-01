const Level = require('./level')

class Levels {
  constructor (place, river, type, levels) {
    const filters = ['river', 'sea', 'rainfall', 'groundwater'].map(item => ({
      type: item,
      count: levels.filter(level => level.group_type === item).length
    }))
    type = type || filters.find(x => x.count > 0).type || filters[0].type
    levels = levels.filter(level => level.group_type === type)
    this.filters = filters
    this.type = type
    this.numItems = levels.length
    this.hasHigh = false
    this.items = levels.map(level => {
      const count = levels.filter(x => x.river_display === level.river_display).length
      const start = levels.findIndex(x => x.river_display === level.river_display) + 1
      return new Level(level, count, start)
    })
    this.bbox = place.bboxBuffered || river.bbox || []
  }
}
module.exports = Levels
