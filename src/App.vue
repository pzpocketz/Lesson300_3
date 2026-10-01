<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import { PhArrowRight, PhCalendarBlank, PhCamera, PhCaretRight, PhCheck, PhCheckCircle, PhClipboardText, PhCloudCheck, PhCrosshair, PhListChecks, PhMapPin, PhMapTrifold, PhMagnifyingGlass, PhNavigationArrow, PhSealCheck, PhWarning, PhWarningCircle, PhWifiHigh, PhX, PhClock } from '@phosphor-icons/vue'
import siteData from './data/fieldops.json'

type View = 'check-in' | 'incident' | 'map' | 'tasks'
type AssetStatus = 'ok' | 'attention' | 'skipped' | 'pending'
type Asset = { id: string; name: string; type: string; location: string; coordinates: [number, number]; lastChecked: string | null; status: AssetStatus; conditionNote?: string }
type Incident = { id: string; type: string; severity: 'Low' | 'Medium' | 'High'; description: string; coordinates: [number, number]; timestamp: string }
type RouteStop = { id: string; order: number; name: string; coordinates: [number, number]; address: string; assetIds: string[]; flaggedItems: string[] }
type Task = { id: string; name: string; assetId: string; dueTime: string; completed: boolean; overdue: boolean }
type CrewMember = { id: string; name: string; role: string; employeeId: string; assignedStops: string[] }

function readStored<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(`fieldops-${key}`); return value ? JSON.parse(value) as T : fallback }
  catch { return fallback }
}
const assets = ref<Asset[]>(readStored('assets', siteData.assets as Asset[]))
const incidents = ref<Incident[]>(readStored('incidents', siteData.incidents as Incident[]))
const tasks = ref<Task[]>(readStored('tasks', siteData.tasks as Task[]))
const route = siteData.route as RouteStop[]
const crew = siteData.crew as CrewMember[]
const views: { id: View; label: string; icon: typeof PhClipboardText }[] = [
  { id: 'check-in', label: 'Check-in', icon: PhClipboardText }, { id: 'incident', label: 'Incident', icon: PhWarningCircle },
  { id: 'map', label: 'Map', icon: PhMapTrifold }, { id: 'tasks', label: 'Tasks', icon: PhListChecks },
]
const activeView = ref<View>('check-in')
const searchQuery = ref('')
const selectedAssetId = ref<string | null>(null)
const checkinStatus = ref<Exclude<AssetStatus, 'pending'>>('ok')
const conditionNote = ref('')
const checkinPhoto = ref<File | null>(null)
const checkinPhotoInput = ref<HTMLInputElement | null>(null)
const incidentPhotoInput = ref<HTMLInputElement | null>(null)
const incidentPhoto = ref<File | null>(null)
const incidentType = ref<string | null>('Spill / release')
const incidentSeverity = ref<Incident['severity']>('Medium')
const incidentDescription = ref('')
const incidentLocation = ref('35.28160, -119.04810')
const incidentError = ref('')
const incidentSuccess = ref<{ id: string; timestamp: string } | null>(null)
const notice = ref('')
const selectedStopId = ref(route[0]?.id ?? '')
const mapHost = ref<HTMLDivElement | null>(null)
const touchStartX = ref<number | null>(null)
let mapInstance: L.Map | null = null
let noticeTimeout = 0

const selectedAsset = computed(() => assets.value.find((asset) => asset.id === selectedAssetId.value) ?? null)
const filteredAssets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return query ? assets.value.filter((asset) => `${asset.name} ${asset.id} ${asset.type} ${asset.location}`.toLowerCase().includes(query)) : assets.value
})
const checkedCount = computed(() => assets.value.filter((asset) => asset.status !== 'pending').length)
const completedTasks = computed(() => tasks.value.filter((task) => task.completed).length)
const overdueCount = computed(() => tasks.value.filter((task) => task.overdue && !task.completed).length)
const orderedTasks = computed(() => [...tasks.value].sort((a, b) => {
  const priority = (task: Task) => task.completed ? 2 : task.overdue ? 0 : 1
  return priority(a) - priority(b) || a.dueTime.localeCompare(b.dueTime)
}))
const selectedStop = computed(() => route.find((stop) => stop.id === selectedStopId.value) ?? route[0])
const selectedStopAssets = computed(() => assets.value.filter((asset) => selectedStop.value?.assetIds.includes(asset.id)))

function statusLabel(status: AssetStatus) { return { ok: 'OK', attention: 'Needs attention', skipped: 'Skipped', pending: 'Pending' }[status] }
function statusIcon(status: AssetStatus) { return status === 'ok' ? PhCheckCircle : status === 'attention' ? PhWarningCircle : status === 'skipped' ? PhX : PhCalendarBlank }
function formatTime(value: string | null) { return value ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Not checked today' }
function persist(key: string, value: unknown) {
  try { localStorage.setItem(`fieldops-${key}`, JSON.stringify(value)) }
  catch { showNotice('Changes are available for this session only.') }
}
function showNotice(message: string) {
  notice.value = message
  window.clearTimeout(noticeTimeout)
  noticeTimeout = window.setTimeout(() => { notice.value = '' }, 3200)
}
function openCheckin(asset: Asset) {
  selectedAssetId.value = selectedAssetId.value === asset.id ? null : asset.id
  checkinStatus.value = asset.status === 'pending' ? 'ok' : asset.status
  conditionNote.value = asset.conditionNote ?? ''
  checkinPhoto.value = null
}
function saveCheckin() {
  if (!selectedAsset.value) return
  const name = selectedAsset.value.name
  const checkedAt = new Date().toISOString()
  assets.value = assets.value.map((asset) => asset.id === selectedAssetId.value
    ? { ...asset, status: checkinStatus.value, lastChecked: checkedAt, conditionNote: conditionNote.value.trim() } : asset)
  persist('assets', assets.value)
  selectedAssetId.value = null
  showNotice(`${name} check-in saved.`)
}
function onPhotoSelected(event: Event, target: 'checkin' | 'incident') {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (target === 'checkin') checkinPhoto.value = file
  else incidentPhoto.value = file
}
function useCurrentLocation() {
  if (!navigator.geolocation) return showNotice('Location is not available on this device.')
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => { incidentLocation.value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` },
    () => showNotice('Could not read location. Check device permissions.'),
    { enableHighAccuracy: true, timeout: 8000 },
  )
}
function submitIncident() {
  if (!incidentDescription.value.trim()) { incidentError.value = 'Add a short description before submitting.'; return }
  incidentError.value = ''
  const now = new Date()
  const id = `INC-2026-${String(incidents.value.length + 1).padStart(3, '0')}`
  incidents.value = [{ id, type: incidentType.value ?? 'Other', severity: incidentSeverity.value, description: incidentDescription.value.trim(), coordinates: incidentLocation.value.split(',').map(Number) as [number, number], timestamp: now.toISOString() }, ...incidents.value]
  persist('incidents', incidents.value)
  incidentSuccess.value = { id, timestamp: now.toISOString() }
  incidentDescription.value = ''
  incidentPhoto.value = null
  if (incidentPhotoInput.value) incidentPhotoInput.value.value = ''
}
function toggleTask(task: Task) {
  task.completed = !task.completed
  if (task.completed) task.overdue = false
  persist('tasks', tasks.value)
}
function onTaskTouchStart(event: TouchEvent) { touchStartX.value = event.changedTouches[0]?.clientX ?? null }
function onTaskTouchEnd(event: TouchEvent, task: Task) {
  const endX = event.changedTouches[0]?.clientX
  if (touchStartX.value !== null && endX !== undefined && endX - touchStartX.value > 72 && !task.completed) toggleTask(task)
  touchStartX.value = null
}
function selectStop(stop: RouteStop) { selectedStopId.value = stop.id; mapInstance?.flyTo(stop.coordinates, 16, { duration: 0.35 }) }
function mountMap() {
  if (!mapHost.value || mapInstance) return
  mapInstance = L.map(mapHost.value, { zoomControl: false, scrollWheelZoom: false }).setView(route[0].coordinates, 14)
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).addTo(mapInstance)
  L.polyline(route.map((stop) => stop.coordinates), { color: '#b9440a', weight: 4, opacity: 0.9, dashArray: '7 9' }).addTo(mapInstance)
  route.forEach((stop) => {
    const marker = L.marker(stop.coordinates, { icon: L.divIcon({ className: 'route-marker-shell', html: `<span class="route-marker">${stop.order}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] }), title: stop.name, keyboard: true }).addTo(mapInstance!)
    marker.bindTooltip(`${String(stop.order).padStart(2, '0')} · ${stop.name}`, { direction: 'top', offset: [0, -18] })
    marker.on('click', () => selectStop(stop))
  })
  L.circleMarker([35.279, -119.055], { radius: 9, color: '#fff', weight: 3, fillColor: '#1c3a4a', fillOpacity: 1 }).addTo(mapInstance).bindTooltip('Crew location', { direction: 'top' })
  window.setTimeout(() => mapInstance?.invalidateSize(), 80)
}
watch(activeView, async (view) => {
  if (view === 'map') { await nextTick(); mountMap() }
  else if (mapInstance) { mapInstance.remove(); mapInstance = null }
})
onBeforeUnmount(() => { window.clearTimeout(noticeTimeout); mapInstance?.remove() })
</script>

<template>
  <div class="app-shell">
    <header class="topbar"><a class="brand" href="#" aria-label="FieldOps home" @click.prevent="activeView = 'check-in'"><span class="brand-mark"><PhNavigationArrow weight="fill" /></span><span class="brand-copy"><strong>FIELD<span>OPS</span></strong><small>FIELDWORK CONSOLE</small></span></a><div class="site-identity"><span class="site-kicker">ACTIVE SITE</span><strong>Ridgeline Energy <i>/</i> Site 4</strong></div><div class="topbar-status"><span class="sync-status"><PhCloudCheck /><span><small>LAST SYNC</small><strong>09:14 AM</strong></span></span><span class="signal-status"><PhWifiHigh aria-label="Signal available" /><span>Connected</span></span><span class="date-status"><PhCalendarBlank /> THU, OCT 01</span></div></header>
    <div class="workspace">
      <aside class="sidebar" aria-label="Primary navigation"><span class="sidebar-label">WORKSPACE</span><nav class="side-navigation"><button v-for="view in views" :key="view.id" class="nav-item" :class="{ active: activeView === view.id }" :aria-current="activeView === view.id ? 'page' : undefined" @click="activeView = view.id"><component :is="view.icon" /><span>{{ view.label }}</span><b v-if="view.id === 'tasks' && overdueCount" class="nav-count">{{ overdueCount }}</b><PhCaretRight v-else-if="activeView === view.id" class="nav-chevron" /></button></nav><div class="sidebar-rule"></div><span class="sidebar-label">ON SHIFT</span><div class="crew-list"><div v-for="member in crew" :key="member.id" class="crew-member"><span class="crew-avatar" :class="`avatar-${member.id}`">{{ member.name.split(' ').map((part) => part[0]).join('') }}</span><span class="crew-copy"><strong>{{ member.name }}</strong><small>{{ member.role }}</small></span><i class="crew-online" :aria-label="`${member.name} on shift`"></i></div></div><div class="sidebar-bottom"><i></i><span><strong>Field mode active</strong><small>Data saved on this device</small></span></div></aside>
      <main class="main-content">
        <section v-if="activeView === 'check-in'" class="page-content"><div class="page-heading"><div><div class="eyebrow">FIELD LOG <i></i> SHIFT 06:30–15:00</div><h1>Asset check-in</h1><p class="page-subtitle">Confirm site conditions and record what you find.</p></div><div class="heading-stamp"><PhCalendarBlank />Thursday, October 1, 2026</div></div>
          <section class="checkin-progress" aria-label="Check-in completion"><div class="progress-copy"><strong>{{ checkedCount }}<small> / {{ assets.length }}</small></strong><span>ASSETS CHECKED</span></div><div class="progress-track" role="progressbar" :aria-valuenow="checkedCount" :aria-valuemin="0" :aria-valuemax="assets.length"><i :style="{ width: `${checkedCount / assets.length * 100}%` }"></i></div><span class="progress-remaining">{{ assets.length - checkedCount }} remaining</span></section>
          <div v-if="checkedCount === assets.length" class="all-clear" role="status"><PhSealCheck /><span><strong>All clear.</strong> Every site asset has been checked in.</span></div><div class="list-toolbar"><div><h2>Site assets</h2><span class="count-tag">{{ filteredAssets.length }} ASSETS</span></div><label class="search-control"><PhMagnifyingGlass /><input v-model="searchQuery" type="search" placeholder="Search assets" aria-label="Search assets" /><kbd>/</kbd></label></div>
          <div class="asset-list"><article v-for="asset in filteredAssets" :key="asset.id" class="asset-card" :class="[`asset-${asset.status}`, { expanded: selectedAssetId === asset.id }]">
            <div class="asset-row"><span class="asset-glyph" :class="`glyph-${asset.status}`"><component :is="statusIcon(asset.status)" weight="fill" :aria-label="statusLabel(asset.status)" /></span><div class="asset-info"><div><h3>{{ asset.name }}</h3><span class="asset-id">{{ asset.id }}</span></div><p>{{ asset.type }} <i>·</i> {{ asset.location }}</p></div><div class="last-check"><span>LAST CHECK</span><strong>{{ formatTime(asset.lastChecked) }}</strong></div><span class="status-pill" :class="`pill-${asset.status}`"><component :is="statusIcon(asset.status)" />{{ statusLabel(asset.status) }}</span><v-btn class="asset-action" :variant="asset.status === 'pending' ? 'flat' : 'outlined'" :color="asset.status === 'pending' ? 'primary' : 'secondary'" height="48" @click="openCheckin(asset)">{{ selectedAssetId === asset.id ? 'Close' : asset.status === 'pending' ? 'Check in' : 'Update' }}<PhArrowRight v-if="selectedAssetId !== asset.id" /></v-btn></div>
            <div v-if="selectedAssetId === asset.id && selectedAsset" class="checkin-editor"><div class="editor-heading"><div><span class="editor-label">NEW FIELD ENTRY</span><h4>{{ selectedAsset.name }}</h4></div><span class="editor-time"><PhClock />{{ formatTime(new Date().toISOString()) }}</span></div><div class="condition-selector" role="group" aria-label="Asset condition"><button :class="{ selected: checkinStatus === 'ok' }" :aria-pressed="checkinStatus === 'ok'" @click="checkinStatus = 'ok'"><PhCheckCircle />OK</button><button :class="{ selected: checkinStatus === 'attention' }" :aria-pressed="checkinStatus === 'attention'" @click="checkinStatus = 'attention'"><PhWarningCircle />Needs attention</button><button :class="{ selected: checkinStatus === 'skipped' }" :aria-pressed="checkinStatus === 'skipped'" @click="checkinStatus = 'skipped'"><PhX />Skipped</button></div><v-textarea v-model="conditionNote" class="field-input" label="Condition note (optional)" placeholder="Add details for the next crew member…" variant="outlined" rows="2" auto-grow hide-details /><input ref="checkinPhotoInput" class="visually-hidden" type="file" accept="image/*" aria-label="Attach an asset photo" @change="onPhotoSelected($event, 'checkin')" /><div class="editor-actions"><v-btn class="photo-button" variant="outlined" color="secondary" height="48" @click="checkinPhotoInput?.click()"><PhCamera />{{ checkinPhoto?.name ?? 'Add photo' }}</v-btn><v-btn class="save-button" color="primary" height="48" @click="saveCheckin"><PhCheck />Save check-in</v-btn></div></div>
          </article><div v-if="!filteredAssets.length" class="empty-state"><PhMagnifyingGlass /><strong>No assets match that search.</strong><button @click="searchQuery = ''">Clear search</button></div></div><p class="offline-note"><PhCloudCheck />Entries are stored on this device and sync when a connection is available.</p>
        </section>
        <section v-else-if="activeView === 'incident'" class="page-content incident-page"><div class="page-heading"><div><div class="eyebrow">SAFETY LOG <i></i> PRIVATE TO SITE 4</div><h1>Incident report</h1><p class="page-subtitle">Record a safety or environmental event before leaving the area.</p></div><div class="incident-stamp"><PhWarningCircle /><span>REPORTING LINE<br /><strong>Ridgeline / Site 4</strong></span></div></div>
          <div v-if="incidentSuccess" class="success-panel" role="status"><span class="success-mark"><PhCheckCircle weight="fill" /></span><div><span class="editor-label">REPORT SUBMITTED</span><h2>Incident logged</h2><p>Reference <strong>{{ incidentSuccess.id }}</strong> · {{ formatTime(incidentSuccess.timestamp) }}</p></div><button class="start-another" @click="incidentSuccess = null">New report <PhArrowRight /></button></div>
          <form v-else class="incident-form" @submit.prevent="submitIncident"><div class="form-heading"><span>01</span><div><h2>Event details</h2><p>Use clear, factual language. Include what happened and where.</p></div></div><div class="incident-fields"><v-select v-model="incidentType" class="field-input wide-field" label="Incident type" :items="['Spill / release', 'Near miss', 'Equipment damage', 'Injury', 'Environmental concern', 'Other']" variant="outlined" hide-details />
            <div class="location-field"><label class="plain-label" for="incident-location">LOCATION <small>GPS OR MANUAL</small></label><div class="location-input"><PhMapPin /><input id="incident-location" v-model="incidentLocation" aria-label="Incident location coordinates" /><v-btn class="location-button" variant="outlined" color="secondary" height="48" aria-label="Use current GPS location" @click="useCurrentLocation"><PhCrosshair /><span>Use GPS</span></v-btn></div></div>
            <div class="severity-field"><span class="plain-label">SEVERITY <small>SELECT ONE</small></span><div class="severity-options" role="group" aria-label="Incident severity"><button v-for="level in ['Low', 'Medium', 'High'] as const" :key="level" type="button" :class="[`severity-${level.toLowerCase()}`, { selected: incidentSeverity === level }]" :aria-pressed="incidentSeverity === level" @click="incidentSeverity = level"><i></i>{{ level }}</button></div></div>
            <v-textarea v-model="incidentDescription" class="field-input wide-field" label="Description" placeholder="Describe the event, immediate response, and any follow-up needed…" variant="outlined" rows="5" auto-grow :error-messages="incidentError" /><input ref="incidentPhotoInput" class="visually-hidden" type="file" accept="image/*" aria-label="Attach an incident photo" @change="onPhotoSelected($event, 'incident')" /><v-btn class="photo-button wide-field" variant="outlined" color="secondary" height="48" @click="incidentPhotoInput?.click()"><PhCamera />{{ incidentPhoto?.name ?? 'Attach a photo' }}</v-btn></div><div class="submit-row"><span><PhCloudCheck />Saved to device until synced</span><v-btn class="submit-button" type="submit" color="primary" height="56"><PhWarningCircle />Submit incident report</v-btn></div></form>
          <section class="recent-incidents"><div class="section-title"><div><span class="editor-label">SITE 4 · TODAY</span><h2>Recent reports</h2></div><span class="count-tag">{{ incidents.length }} REPORTS</span></div><article v-for="incident in incidents.slice(0, 3)" :key="incident.id" class="incident-row"><span class="incident-mark" :class="`mark-${incident.severity.toLowerCase()}`"><PhWarning /></span><div class="incident-copy"><strong>{{ incident.type }}</strong><span>{{ incident.description }}</span></div><span class="severity-tag" :class="`tag-${incident.severity.toLowerCase()}`">{{ incident.severity }}</span><time>{{ formatTime(incident.timestamp) }}</time></article></section>
        </section>
        <section v-else-if="activeView === 'map'" class="page-content map-page"><div class="page-heading"><div><div class="eyebrow">ROUTE 01 <i></i> {{ route.length }} WAYPOINTS</div><h1>Today's route</h1><p class="page-subtitle">Ridgeline Energy · Site 4 · Kern County, California</p></div><div class="route-distance"><PhNavigationArrow /><span><strong>6.8 mi</strong><small>EST. 2H 20M</small></span></div></div><div class="map-layout"><section class="map-panel" aria-label="Map of today's route"><div ref="mapHost" class="leaflet-map"></div><div class="map-legend"><span><i class="legend-stop">1</i>Scheduled stop</span><span><i class="legend-current"></i>Crew location</span><span><i class="legend-route"></i>Route</span></div><span class="map-note">OpenStreetMap</span></section><aside class="route-panel" aria-label="Route stops"><div class="route-panel-heading"><div><span class="editor-label">THURSDAY · OCT 01</span><h2>Route stops</h2></div><span class="count-tag">{{ route.length }} STOPS</span></div><div class="route-stop-list"><button v-for="stop in route" :key="stop.id" class="route-stop" :class="{ selected: selectedStopId === stop.id }" @click="selectStop(stop)"><span class="stop-number">{{ String(stop.order).padStart(2, '0') }}</span><span class="stop-copy"><strong>{{ stop.name }}</strong><small>{{ stop.address }}</small><em>{{ stop.assetIds.length }} {{ stop.assetIds.length === 1 ? 'asset' : 'assets' }}<b v-if="stop.flaggedItems.length"> · {{ stop.flaggedItems.length }} flagged</b></em></span><PhCaretRight /></button></div><div v-if="selectedStop" class="selected-stop"><span class="editor-label">SELECTED WAYPOINT</span><h3>{{ selectedStop.name }}</h3><p>{{ selectedStop.address }}</p><div class="stop-assets"><span v-for="asset in selectedStopAssets" :key="asset.id"><i :class="`mini-${asset.status}`"></i>{{ asset.name }}</span></div><div v-if="selectedStop.flaggedItems.length" class="flagged-note"><PhWarningCircle />{{ selectedStop.flaggedItems.join(' · ') }}</div></div></aside></div></section>
        <section v-else class="page-content tasks-page"><div class="page-heading"><div><div class="eyebrow">COMPLIANCE LOG <i></i> SHIFT 06:30–15:00</div><h1>Today's tasks</h1><p class="page-subtitle">Required checks for Ridgeline Energy · Site 4.</p></div><div class="tasks-date"><PhCalendarBlank /><span>THU, OCT 01<small>2026</small></span></div></div><section class="task-summary" aria-label="Task completion"><div class="task-summary-copy"><strong>{{ completedTasks }}<small> / {{ tasks.length }}</small></strong><span>Tasks complete<small>{{ tasks.length - completedTasks }} still on your list</small></span></div><div class="task-summary-right"><span v-if="overdueCount"><PhWarningCircle />{{ overdueCount }} OVERDUE</span><div class="task-progress" role="progressbar" :aria-valuenow="completedTasks" :aria-valuemin="0" :aria-valuemax="tasks.length"><i :style="{ width: `${completedTasks / tasks.length * 100}%` }"></i></div></div></section><div class="task-list-heading"><h2>Required checks</h2><span>Swipe right or tap to complete</span></div><div class="task-list"><article v-for="task in orderedTasks" :key="task.id" class="task-card" :class="{ completed: task.completed, overdue: task.overdue && !task.completed }" @touchstart.passive="onTaskTouchStart" @touchend="onTaskTouchEnd($event, task)"><button class="task-check" :class="{ checked: task.completed }" :aria-pressed="task.completed" :aria-label="`${task.completed ? 'Mark incomplete' : 'Complete'}: ${task.name}`" @click="toggleTask(task)"><PhCheck v-if="task.completed" /></button><div class="task-copy"><strong>{{ task.name }}</strong><span>{{ assets.find((asset) => asset.id === task.assetId)?.name ?? task.assetId }} · {{ task.assetId }}</span></div><span class="task-due" :class="{ 'due-overdue': task.overdue && !task.completed }"><PhClock />{{ task.overdue && !task.completed ? 'OVERDUE' : 'DUE' }} {{ task.dueTime }}</span><span v-if="task.completed" class="task-state">DONE</span><span v-else-if="task.overdue" class="task-state alert"><PhWarningCircle />OVERDUE</span></article></div><p class="offline-note"><PhCloudCheck />Task updates are saved on this device and sync when a connection is available.</p></section>
      </main>
    </div>
    <nav class="mobile-navigation" aria-label="Primary navigation"><button v-for="view in views" :key="view.id" :class="{ active: activeView === view.id }" :aria-current="activeView === view.id ? 'page' : undefined" @click="activeView = view.id"><component :is="view.icon" /><span>{{ view.label }}</span><i v-if="view.id === 'tasks' && overdueCount">{{ overdueCount }}</i></button></nav>
    <Transition name="notice"><div v-if="notice" class="toast-notice" role="status"><PhCheckCircle />{{ notice }}</div></Transition>
  </div>
</template>
