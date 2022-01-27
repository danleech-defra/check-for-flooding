'use strict'
// Chart component

import { axisBottom, axisLeft } from 'd3-axis'
import { scaleLinear, scaleBand } from 'd3-scale'
import { timeFormat } from 'd3-time-format'
import { select, pointer } from 'd3-selection'
import { max } from 'd3-array'
import { timeMinute } from 'd3-time'
const { xhr } = window.flood.utils

function BarChart (containerId, telemetryId) {
  const renderChart = () => {
    // Setup scales with domains
    xScale = setScaleX()
    yScale = setScaleY(period === 'minutes' ? 1 : 4)

    // Set right margin depending on length of labels
    const numChars = yScale.domain()[1].toString().length
    const margin = { top: 5, bottom: 45, left: 0, right: 8 + (numChars * 9) }

    // Define width and height
    const containerBoundingRect = container.getBoundingClientRect()
    const controlsContainerBoundingRect = controlsContainer.getBoundingClientRect()
    width = Math.floor(containerBoundingRect.width) - margin.right - margin.left
    height = Math.floor(containerBoundingRect.height) - margin.bottom - margin.top
    height -= Math.floor(controlsContainerBoundingRect.height)

    // Calculate new xScale from range
    xScale = xScale.range([0, width]).padding(0.4)
    const xAxis = axisBottom(xScale).tickSizeOuter(0).tickValues(xScale.domain().filter((d, i) => {
      const hourMinute = timeFormat('%H:%M')(new Date(d))
      const labelsHours = ['00:00']
      const labelsMinutes = ['00:00', '06:00', '12:00', '18:00']
      const labels = period === 'hours' ? labelsHours : labelsMinutes
      return labels.includes(hourMinute) && i >= 2 // Don't show lable if before 3rd tick
    }))
    xAxis.tickFormat((d) => { return '' })

    // Calculate new yScale from range
    yScale = yScale.range([height, 0])
    const yAxis = axisLeft(yScale).tickSizeOuter(0).ticks(5)

    // Position axis bottom and right
    svg.select('.x.axis').attr('transform', 'translate(0,' + height + ')').call(xAxis)
    svg.select('.y.axis').attr('transform', 'translate(' + width + ', 0)').call(yAxis)

    // Format X Axis ticks
    svg.select('.x.axis').selectAll('text').each(formatLabelsX)

    // Position y ticks
    svg.select('.y.axis').style('text-anchor', 'start')
    svg.selectAll('.y.axis .tick line').attr('x2', 6)
    svg.selectAll('.y.axis .tick text').attr('x', 9)

    // Position y grid
    svg.select('.y.grid')
      .attr('transform', 'translate(0,' + 0 + ')')
      .call(axisLeft(yScale).tickSizeOuter(0).ticks(5).tickSize(-width, 0, 0).tickFormat(''))

    // Update grid container and text clip
    grid.attr('width', width).attr('height', height)
    clipText.attr('width', width).attr('height', height)

    // Add bars
    gridRow.selectAll('.bar').remove()
    const bars = gridRow.selectAll('.bar').data(dataPage).enter()
      .append('g')
      .attr('role', 'cell')
      .attr('tabindex', (d) => { return d === dataItem ? 0 : -1 })
      .attr('data-index', (d, i) => { return i })
      .attr('data-datetime', (d) => { return d.dateTime })
      .attr('class', 'bar')
      .attr('aria-hidden', (d) => { return !(d.value > 0 || d.isLatest) })
      .classed('bar--incomplete', (d) => { return d.isInComplete })
      .classed('bar--latest', (d) => { return d.isLatest })
    bars.filter((d) => { return d.isLatest }).append('line').attr('aria-hidden', true).attr('class', 'latest-line')
    bars.append('rect').attr('class', 'bar__fill')
    bars.append('text').text((d) => {
      const text = getItemText(d)
      return `${text.value}, ${text.period}, ${text.monthLong} `
    })

    // Position bars
    svg.selectAll('.bar')
      .attr('transform', (d) => { return 'translate(' + xScale(d.dateTime) + ', 0)' })
    svg.selectAll('.bar__fill')
      .attr('x', 0)
      .attr('y', (d) => { return yScale(d.value) })
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => { return height - yScale(d.value) })

    // Draw latest reading line
    const xLatest = Math.round(xScale.bandwidth() / 2)
    svg.select('.latest-line').attr('transform', 'translate(' + xLatest + ', 0)').attr('y1', 0).attr('y2', height)
  }

  const setScaleX = () => {
    return scaleBand().domain(dataPage.map((d) => { return d.dateTime }).reverse())
  }

  const setScaleY = (minimum) => {
    // Get max from data or minimum
    let maxData = Math.max(max(dataPage, (d) => { return d.value }), minimum)
    // Buffer 25% and round to nearest integer
    maxData = Math.ceil((maxData * 1.25) * 10 / 10)
    // Ensure y scale always divides by 5
    maxData = Math.ceil(maxData / 5) * 5
    // return scaleLinear().domain([0, maxData])
    return scaleLinear().domain([0, maxData])
  }

  const setTooltipPosition = (x, y) => {
    // Set Background size
    const text = tooltip.select('text')
    const txtHeight = Math.round(text.node().getBBox().height) + 23
    const pathLength = period === 'minutes' ? 182 : 142
    const pathLeft = `M${pathLength},${(txtHeight / 2) - 8}l-0,-${(txtHeight / 2) - 8}l-${pathLength},0l0,${txtHeight}l${pathLength},0l0,-${(txtHeight / 2) - 8}l8,-8l-8,-8Z`
    const pathRight = `M8,${(txtHeight / 2) - 8}l0,-${(txtHeight / 2) - 8}l${pathLength},0l-0,${txtHeight}l-${pathLength},0l-0,-${(txtHeight / 2) - 8}l-8,-8l8,-8Z`
    const pathCentre = `M${pathLength},${txtHeight}l0,-${txtHeight}l-${pathLength},0l0,${txtHeight}l${pathLength},0Z`
    const pathWidth = pathLength + 8
    // Set tooltip layout
    tooltipText.attr('x', 0).attr('y', 20)
    if (x >= width - (pathWidth + 10)) {
      // tooltip on the left
      x -= (pathWidth + 3)
      tooltipPath.attr('d', pathLeft)
      tooltipValue.attr('x', 12)
      tooltipDescription.attr('x', 12)
    } else {
      // tooltip on the right
      x += 3
      tooltipPath.attr('d', pathRight)
      tooltipValue.attr('x', 20)
      tooltipDescription.attr('x', 20)
    }
    // tooltip centred
    if (x <= 0) {
      x = 0
      tooltipPath.attr('d', pathCentre)
    }
    // Set background above or below position
    const tooltipHeight = tooltipPath.node().getBBox().height
    const tooltipMarginTop = 10
    const tooltipMarginBottom = height - (tooltipHeight + 10)
    y -= tooltipHeight / 2
    y = y < tooltipMarginTop ? tooltipMarginTop : y > tooltipMarginBottom ? tooltipMarginBottom : y
    tooltip.attr('transform', 'translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ')')
    tooltip.classed('tooltip--visible', true)
    locatorLine.classed('locator__line--visible', !dataItem.isLatest)
  }

  const showTooltip = (tooltipY = 10) => {
    // Choose which value to show
    if (!dataItem) return
    // Get tooltip position and content
    const text = getItemText(dataItem)
    tooltipValue.attr('dy', '0.5em').text(text.value)
    tooltipDescription.attr('dy', '1.4em').text(`${text.period}, ${text.monthShort}`)
    // Update locator
    locator.attr('transform', 'translate(' + Math.round(xScale(dataItem.dateTime)) + ', 0)')
    locatorBackground
      .attr('x', 0).attr('y', 0).attr('width', xScale.bandwidth()).attr('height', height)
      .classed('locator__background--visible', (interfaceType === 'keyboard' && document.activeElement.tagName.toLocaleLowerCase() === 'g'))
    locatorLine.attr('transform', 'translate(' + Math.round(xScale.bandwidth() / 2) + ', 0)').attr('y1', 0).attr('y2', height)
    // Update bar selected state
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    svg.select('[data-datetime="' + dataItem.dateTime + '"]').classed('bar--selected', true)
    // Update tooltip location
    const tooltipX = Math.round(xScale(dataItem.dateTime)) + (xScale.bandwidth() / 2)
    setTooltipPosition(tooltipX, tooltipY)
  }

  const getItemText = (item) => {
    const timeStart = timeMinute.offset(new Date(item.dateTime), period === 'minutes' ? -15 : -60)
    const timeEnd = new Date(item.dateTime)
    const formatTime12 = timeFormat(period === 'minutes' ? '%-I:%M%p' : '%-I%p')
    return {
      value: item.isValid ? item.value + 'mm' + (item.isLatest ? ' latest' : '') : 'No data',
      period: `${formatTime12(timeStart).toLowerCase()} - ${formatTime12(timeEnd).toLowerCase()}`,
      monthShort: timeFormat('%e %b')(timeEnd),
      monthLong: timeFormat('%e %B')(timeEnd)
    }
  }

  const getDataItemByX = (x) => {
    const dateTime = scaleBandInvert(xScale)(x)
    dataItem = dataPage.find(x => x.dateTime === dateTime)
    locatorBackground.classed('locator__background--visible', false)
  }

  const getNextDataItemIndex = (isForeward) => {
    let index = dataPage.findIndex(x => x === dataItem)
    // Shift plus arrow keys jumps > 0mm or isLatests
    if (isForeward) {
      for (let i = index; i > 0; i--) {
        if (dataPage[i - 1].value > 0 || dataPage[i - 1].isLatest) {
          index = i - 1
          break
        }
      }
    } else {
      for (let i = index; i < dataPage.length - 1; i++) {
        if (dataPage[i + 1].value > 0 || dataPage[i + 1].isLatest) {
          index = i + 1
          break
        }
      }
    }
    return index
  }

  const hideTooltip = () => {
    svg.selectAll('.bar--selected').classed('bar--selected', false)
    tooltip.classed('tooltip--visible', false)
    locator.classed('locator--visible', false)
    locatorLine.classed('locator__line--visible', false)
    locatorBackground.classed('locator__background--visible', false)
  }

  const updateSegmentedControl = () => {
    segmentedControl.querySelectorAll('.defra-chart-segmented-control__segment input').forEach(input => {
      const selectedClass = 'defra-chart-segmented-control__segment--selected'
      if (period === input.getAttribute('data-period')) {
        input.parentNode.classList.add(selectedClass)
        input.checked = true
      } else {
        input.parentNode.classList.remove(selectedClass)
        input.checked = false
      }
    })
  }

  const updatePagingControl = (start, end, duration, durationHours) => {
    // Set paging values and ensure they are within data range
    const now = new Date()
    const dataStart = new Date(dataCache.dataStartDateTime)
    let nextStart = new Date(start.getTime() + duration)
    let nextEnd = new Date(end.getTime() + duration)
    let previousStart = new Date(start.getTime() - duration)
    let previousEnd = new Date(end.getTime() - duration)
    nextEnd = nextEnd.getTime() <= now.getTime() ? nextEnd.toISOString().replace(/.\d+Z$/g, 'Z') : null
    nextStart = nextEnd ? nextStart.toISOString().replace(/.\d+Z$/g, 'Z') : null
    previousStart = previousStart.getTime() >= dataStart.getTime() ? previousStart.toISOString().replace(/.\d+Z$/g, 'Z') : null
    previousEnd = previousStart ? previousEnd.toISOString().replace(/.\d+Z$/g, 'Z') : null
    // Set properties
    pagingControl.style.display = (nextStart || previousEnd) ? 'inline-block' : 'none'
    pageForward.setAttribute('data-start', nextStart)
    pageForward.setAttribute('data-end', nextEnd)
    pageBack.setAttribute('data-start', previousStart)
    pageBack.setAttribute('data-end', previousEnd)
    pageForward.setAttribute('aria-disabled', !(nextStart && nextEnd))
    pageBack.setAttribute('aria-disabled', !(previousStart && previousEnd))
    const pageForwardText = `View next ${durationHours > 1 ? durationHours : duration} ${durationHours > 1 ? 'hours' : 'minutes'}`
    const pageBackText = `View previous ${durationHours > 1 ? durationHours : duration} ${durationHours > 1 ? 'hours' : 'minutes'}`
    pageForwardDescription.innerText = nextStart && nextEnd ? pageForwardText : 'No more data'
    pageBackDescription.innerText = previousStart && previousEnd ? pageBackText : 'No previous data'
  }

  const updateGrid = (colcount, total, hours, days, start, end) => {
    // Update grid properites
    grid.attr('aria-rowcount', 1)
    grid.attr('aria-colcount', colcount)
    description.innerHTML = `
    Showing ${hours > 24 ? days : hours} ${hours > 24 ? 'days' : 'hours'}
    from ${timeFormat('%e %B %Y at %-I:%M%p')(start)} to ${timeFormat('%e %B %Y at %-I:%M%p')(end)} in ${period === 'hours' ? 'hourly' : '15 minute'} totals.
    There was ${total > 0 ? total.toFixed(1) + 'mm' : 'no rainfall'} in this period.
  `
    const hasLatest = !!dataPage.find(x => x.isLatest)
    description.innerHTML += hasLatest ? `Last reading received at ${timeFormat('%-I:%M%p, %e %B %Y')(new Date(dataCache.latestDateTime))}` : ''
  }

  const getDataPage = (start, end) => {
    const cacheStart = new Date(dataCache.cacheStartDateTime)
    const cacheEnd = new Date(dataCache.cacheEndDateTime)
    const pageStart = new Date(start)
    const pageEnd = new Date(end)
    // If dates are outside range we need to load another data cache
    if (pageStart.getTime() < cacheStart.getTime() || pageEnd.getTime() > cacheEnd.getTime()) {
      // Rebuild the cache when we have more data
      // Set cache start and end
      // Set page start and end
      // Load new data and reinitialise the chart
      // xhr(`/service/telemetry-rainfall/${telemetryId}/${cacheStart}/${cacheEnd}`, initChart, 'json')
      return
    }
    // Determin which resolution and telemetry set to use
    const pageDuration = pageEnd.getTime() - pageStart.getTime()
    const pageDurationHours = pageDuration / (1000 * 60 * 60)
    const pageDurationDays = pageDuration / (1000 * 60 * 60 * 24)
    period = pageDurationHours > 24 ? 'hours' : 'minutes'
    dataPage = period === 'hours' ? dataCache.telemetryHours : dataCache.telemetryMinutes
    // Get the durartion between values, typically 15 or 60 mins
    const valueStart = new Date(dataPage[1].dateTime)
    const valueEnd = new Date(dataPage[0].dateTime)
    const valueDuration = valueEnd.getTime() - valueStart.getTime()
    dataPage = dataPage.filter(x => {
      const date = new Date(x.dateTime)
      return date.getTime() > (pageStart.getTime() + valueDuration) && date.getTime() <= (pageEnd.getTime() + valueDuration)
    })
    // Set current data item depending on paging direction and presence of latest reading
    dataItem = dataPage.find(x => x.isLatest)
    const positiveDataItems = dataPage.map((x, i) => { return x.value > 0 || x.isLatest ? i : -1 }).filter(x => x >= 0)
    if (direction && positiveDataItems.length) {
      dataItem = direction === 'forward' ? dataPage[positiveDataItems[positiveDataItems.length - 1]] : dataPage[positiveDataItems[0]]
    }
    // Update html control properties
    updateSegmentedControl()
    updatePagingControl(pageStart, pageEnd, pageDuration, pageDurationHours)
    const totalPageRainfall = dataPage.reduce((a, b) => { return a + b.value }, 0)
    const pageValueStart = new Date(new Date(dataPage[dataPage.length - 1].dateTime).getTime() - valueDuration)
    const pageValueEnd = new Date(dataPage[0].dateTime)
    updateGrid(positiveDataItems.length, totalPageRainfall, pageDurationHours, pageDurationDays, pageValueStart, pageValueEnd)
  }

  const changePage = (event) => {
    const target = event.target
    direction = target.getAttribute('data-direction')
    pageStart = new Date(target.getAttribute('data-start'))
    pageEnd = new Date(target.getAttribute('data-end'))
    // Move into existing or new methods
    getDataPage(pageStart, pageEnd)
    // Render bars and chart
    renderChart()
    hideTooltip()
    // Show default tooltip
    if (dataItem && dataItem.isLatest) showTooltip()
  }

  const scaleBandInvert = (scale) => {
    // D3 doesnt currently support inverting of a scaleBand
    const domain = scale.domain()
    const paddingOuter = scale(domain[0])
    const eachBand = scale.step()
    return function (value) {
      const index = Math.floor(((value - paddingOuter) / eachBand))
      return domain[Math.max(0, Math.min(index, domain.length - 1))]
    }
  }

  const formatLabelsX = (d, i, nodes) => {
    // Format X Axis labels
    const element = select(nodes[i])
    // const formattedTime = timeFormat(period === 'hours' ? '%-I%p' : '%-I:%M%p')(new Date(d)).toLocaleLowerCase()
    const formattedTime = timeFormat('%-I%p')(new Date(d)).toLocaleLowerCase()
    const formattedDate = timeFormat('%-e %b')(new Date(d))
    element.append('tspan').text(formattedTime)
    element.append('tspan').attr('x', 0).attr('dy', '15').text(formattedDate)
  }

  const initChart = (err, response) => {
    if (err) {
      console.log('Error: ' + err)
    } else {
      dataCache = response
      // Show controls
      controlsContainer.style.display = dataCache.telemetryMinutes.length > 1 ? 'block' : 'none'
      // Move into existing or new methods
      getDataPage(pageStart, pageEnd)
      // Render bars and chart
      renderChart()
      hideTooltip()
      // Show default tooltip
      if (dataItem && dataItem.isLatest) showTooltip()
    }
  }

  //
  // Setup
  //

  const container = document.querySelector(`#${containerId}`)

  // Description
  const description = document.createElement('span')
  description.className = 'govuk-visually-hidden'
  description.setAttribute('aria-live', 'polite')
  description.setAttribute('id', 'bar-chart-description')
  container.appendChild(description)

  // Add controls container
  const controlsContainer = document.createElement('div')
  controlsContainer.style.display = 'none'
  controlsContainer.className = 'defra-chart-controls'
  container.appendChild(controlsContainer)

  // Set initial page dates
  let pageStart = new Date()
  let pageEnd = new Date()
  pageStart.setHours(pageStart.getHours() - 120)
  pageStart = pageStart.toISOString().replace(/.\d+Z$/g, 'Z')
  pageEnd = pageEnd.toISOString().replace(/.\d+Z$/g, 'Z')
  let pageStartMinutes = new Date()
  pageStartMinutes.setHours(pageStartMinutes.getHours() - 24)
  pageStartMinutes = pageStartMinutes.toISOString().replace(/.\d+Z$/g, 'Z')

  // Add time scale buttons
  const segmentedControl = document.createElement('div')
  segmentedControl.className = 'defra-chart-segmented-control'
  segmentedControl.innerHTML = `
  <div class="defra-chart-segmented-control__segment">
    <input class="defra-chart-segmented-control__input" name="time" type="radio" id="timeHours" data-period="hours" data-start="${pageStart}" data-end="${pageEnd}" aria-controls="bar-chart"/>
    <label for="timeHours">Hourly</label>
  </div>
  <div class="defra-chart-segmented-control__segment">
    <input class="defra-chart-segmented-control__input" name="time" type="radio" id="timeMinutes" data-period="minutes" data-start="${pageStartMinutes}" data-end="${pageEnd}" aria-controls="bar-chart"/>
    <label for="timeMinutes">15 minutes</label>
  </div>`
  // container.parentNode.insertBefore(segmentedControl, container)
  controlsContainer.appendChild(segmentedControl)

  // Add paging buttons
  const pagingControl = document.createElement('div')
  pagingControl.style.display = 'none'
  pagingControl.className = 'defra-chart-paging-control'
  const pageBack = document.createElement('button')
  pageBack.className = 'defra-chart-paging-control__button defra-chart-paging-control__button--back'
  pageBack.setAttribute('data-direction', 'back')
  pageBack.setAttribute('aria-controls', 'bar-chart')
  pageBack.setAttribute('aria-describedby', 'page-back-description')
  pageBack.innerHTML = '<span class="defra-chart-paging-control__text">Back</span>'
  const pageBackDescription = document.createElement('span')
  pageBackDescription.id = 'page-back-description'
  pageBackDescription.className = 'govuk-visually-hidden'
  pageBackDescription.setAttribute('aria-live', 'asertive')
  pageBack.appendChild(pageBackDescription)
  const pageForward = document.createElement('button')
  pageForward.className = 'defra-chart-paging-control__button defra-chart-paging-control__button--forward'
  pageForward.setAttribute('data-direction', 'forward')
  pageForward.setAttribute('aria-controls', 'bar-chart')
  pageForward.setAttribute('aria-describedby', 'page-forward-description')
  pageForward.innerHTML = '<span class="defra-chart-paging-control__text">Forward</span>'
  const pageForwardDescription = document.createElement('span')
  pageForwardDescription.id = 'page-forward-description'
  pageForwardDescription.className = 'govuk-visually-hidden'
  pageForwardDescription.setAttribute('aria-live', 'asertive')
  pageForward.appendChild(pageForwardDescription)
  pagingControl.appendChild(pageBack)
  pagingControl.appendChild(pageForward)
  controlsContainer.appendChild(pagingControl)

  // Create chart container elements
  const svg = select(`#${containerId}`).append('svg')
    .attr('aria-label', 'Bar chart')
    .attr('aria-describedby', 'bar-chart-description')

  // Clip path to visually hide text
  const clipText = svg.append('defs').append('clipPath').attr('id', 'clip-text').append('rect').attr('x', 0).attr('y', 0)

  // Add x and y grid containers
  svg.append('g').attr('class', 'y grid').attr('aria-hidden', true)
  svg.append('g').attr('class', 'x axis').attr('aria-hidden', true)
  svg.append('g').attr('class', 'y axis').attr('aria-hidden', true)

  // Add locator
  const locator = svg.append('g').attr('class', 'locator').attr('aria-hidden', true)
  const locatorBackground = locator.append('rect').attr('class', 'locator__background')
  const locatorLine = locator.append('line').attr('class', 'locator__line')

  // Add container for bars
  const grid = svg.append('g').attr('role', 'grid').attr('clip-path', 'url(#clip-text)')
  const gridRow = grid.append('g').attr('role', 'row')

  // Add tooltip container
  const tooltip = svg.append('g').attr('class', 'tooltip').attr('aria-hidden', true)
  const tooltipPath = tooltip.append('path').attr('class', 'tooltip-bg')
  const tooltipText = tooltip.append('text').attr('class', 'tooltip-text')
  const tooltipValue = tooltipText.append('tspan').attr('class', 'tooltip-text__strong')
  const tooltipDescription = tooltipText.append('tspan').attr('class', 'tooltip-text__small')

  // Get width and height
  telemetryId = /[^/]*$/.exec(telemetryId)[0]

  // Set defaults
  let width, height, xScale, yScale, dataCache, dataPage, dataItem, period, direction, interfaceType
  // let isMobile

  // Get mobile media query list
  // const mobileMediaQuery = window.matchMedia('(max-width: 640px)')

  // XMLHttpRequest
  const cacheStart = pageStart // This is effectively the cache date start
  const cacheEnd = pageEnd // This is effectively the cache date end
  xhr(`/service/telemetry-rainfall/${telemetryId}/${cacheStart}/${cacheEnd}`, initChart, 'json')

  //
  // Events
  //

  // mobileMediaQuery.addEventListener('change', renderChart)

  window.addEventListener('resize', () => {
    renderChart()
    if (dataItem && dataItem.isLatest) showTooltip()
  })

  container.addEventListener('click', (e) => {
    if (e.target.getAttribute('aria-disabled') === 'true') return
    const classNames = ['defra-chart-segmented-control__input', 'defra-chart-paging-control__button']
    if (classNames.some(className => e.target.classList.contains(className))) {
      changePage(e)
    }
  })

  container.addEventListener('keyup', (e) => {
    if (!(e.key === 'Tab' && document.activeElement.getAttribute('role') === 'cell')) return
    showTooltip()
  })

  container.addEventListener('keydown', (e) => {
    interfaceType = 'keyboard'
    if (!(e.target.getAttribute('role') === 'cell' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft'))) return
    e.preventDefault()
    const nextIndex = getNextDataItemIndex(e.key === 'ArrowRight')
    const cell = e.target
    const nextCell = cell.parentNode.children[nextIndex]
    nextCell.focus()
    cell.tabIndex = -1
    nextCell.tabIndex = 0
    dataItem = dataPage[nextIndex]
    showTooltip()
  })

  container.addEventListener('focusout', (e) => {
    if (e.target.getAttribute('role') !== 'cell') return
    if (dataItem && dataItem.isLatest) {
      showTooltip()
    } else {
      hideTooltip()
    }
  })

  svg.on('mousemove', (e) => {
    if (!xScale) return
    if (interfaceType === 'touch') {
      interfaceType = 'mouse'
      return
    }
    getDataItemByX(pointer(e)[0])
    showTooltip(pointer(e)[1])
  })

  svg.on('mouseleave', (e) => {
    if (dataPage) {
      dataItem = dataPage.find(x => x.isLatest)
      dataItem ? showTooltip() : hideTooltip()
    }
  })

  svg.on('touchstart', (e) => {
    interfaceType = 'touch'
    const touchEvent = e.targetTouches[0]
    if (!xScale) return
    getDataItemByX(pointer(touchEvent)[0])
    showTooltip(10)
  })

  svg.on('touchmove', (e) => {
    const touchEvent = e.targetTouches[0]
    if (!xScale) return
    getDataItemByX(pointer(touchEvent)[0])
    showTooltip(10)
  })

  this.container = container
}

window.flood.charts = {
  createBarChart: (containerId, telemetryId) => {
    return new BarChart(containerId, telemetryId)
  }
}
