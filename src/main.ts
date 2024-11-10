import './style.css'
import '@picocss/pico/css/pico.min.css'

type TimelineItem = {
	timestamp: number
} & ({ type: 'start' | 'stop' } | { type: 'pause'; cause: string })

const startButton = document.getElementById('start') as HTMLButtonElement
const pauseButton = document.getElementById('pause') as HTMLButtonElement
const stopButton = document.getElementById('stop') as HTMLButtonElement
const resetButton = document.getElementById('reset') as HTMLButtonElement
const exportButton = document.getElementById('export') as HTMLButtonElement
const table = document.getElementById('table') as HTMLTableElement
const tableBody = table.querySelector('tbody') as HTMLTableSectionElement
const timerText = document.getElementById('timer') as HTMLDivElement

let timelineStart: number | null = null
let timeline: TimelineItem[] = []

const offset = () => new Date().getTimezoneOffset() * 60 * 1000
const now = () => Math.floor((Date.now() - offset()) / 1000)

function question(message: string) {
	while (true) {
		const result = prompt(message)
		if (result !== null) return result
	}
}

function formatTime(time: number) {
	const date = new Date(time * 1000)
	return date.toISOString().substring(11, 19)
}

function timelineAdd(item: TimelineItem) {
	const start = timelineStart ?? 0
	// const last = timeline[timeline.length - 1]?.timestamp ?? start
	const row = tableBody.insertRow()
	row.insertCell().textContent = item.type
	row.insertCell().textContent = formatTime(item.timestamp)
	row.insertCell().textContent = formatTime(item.timestamp - start)
	// row.insertCell().textContent = formatTime(item.timestamp - last)
	row.insertCell().textContent = item.type === 'pause' ? item.cause : ''
	timeline.push(item)
}

startButton.addEventListener('click', () => {
	if (timeline.length === 0) {
		startButton.textContent = 'Resume'
		startButton.disabled = true
		pauseButton.disabled = false
		stopButton.disabled = false
		exportButton.disabled = true
		table.classList.remove('hidden')
		timerText.classList.remove('hidden')
		timelineStart = now()
	} else {
		startButton.disabled = true
		pauseButton.disabled = false
		stopButton.disabled = false
	}
	timelineAdd({ timestamp: now(), type: 'start' })
})

pauseButton.addEventListener('click', () => {
	if (timeline.length === 0) return
	const timestamp = now()
	timelineAdd({
		timestamp,
		type: 'pause',
		cause: question('What is the cause of the pause?'),
	})
	startButton.disabled = false
	pauseButton.disabled = true
})

stopButton.addEventListener('click', () => {
	if (timeline.length === 0) return
	const timestamp = now()
	timelineAdd({ timestamp, type: 'stop' })
	startButton.disabled = true
	pauseButton.disabled = true
	stopButton.disabled = true
	resetButton.disabled = false
	exportButton.disabled = false
})

resetButton.addEventListener('click', () => {
	// location.reload()
	timeline = []
	timelineStart = null
	startButton.textContent = 'Start'
	startButton.disabled = false
	pauseButton.disabled = true
	stopButton.disabled = true
	resetButton.disabled = true
	exportButton.disabled = true
	tableBody.innerHTML = ''
	table.classList.add('hidden')
	timerText.classList.add('hidden')
})

exportButton.addEventListener('click', () => {
	const csv = timeline
		.map(item => {
			const data = [
				item.type,
				new Date(item.timestamp * 1000).toISOString().substring(0, 19),
				formatTime(item.timestamp - (timelineStart ?? 0)),
				item.type === 'pause' ? item.cause : '',
			]
			return data.join(';')
		})
		.join('\n')
	const blob = new Blob(['type;datetime;timestamp;data\n', csv], { type: 'text/csv' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	const ts = new Date(timelineStart! * 1000)
		.toISOString()
		.substring(0, 19)
		.replace(/[:-]/g, '')
		.replace('T', '_')
	a.href = url
	a.download = `timeline-${ts}.csv`
	a.click()
	URL.revokeObjectURL(url)
})

requestAnimationFrame(function update() {
	const start = timelineStart ?? 0
	const last = timeline[timeline.length - 1]
	const elapsed = (last?.type === 'stop' ? last.timestamp : now()) - start
	timerText.textContent = `Timer: ${formatTime(elapsed)}`
	requestAnimationFrame(update)
})
