const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/>',
  folder: '<path d="M3 6.5h6l2 2h10v10.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  file: '<path d="M6 2.5h8l4 4V21H6V2.5Z"/><path d="M14 2.5v5h4M9 12h6M9 16h6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 18 5-5 3 3 2-2 4 4"/>',
  link: '<path d="m9.5 14.5 5-5"/><path d="M7.5 17H6a4 4 0 0 1 0-8h3M16.5 7H18a4 4 0 0 1 0 8h-3"/>',
  note: '<path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  upload: '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 14v6h14v-6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/>',
  trash: '<path d="M4 7h16M9 3h6l1 4H8l1-4ZM7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  sparkles: '<path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3Z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  archive: '<path d="M4 7h16v13H4z"/><path d="M3 3h18v4H3zM9 11h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  up: '<path d="m6 14 6-6 6 6"/>',
  down: '<path d="m6 10 6 6 6-6"/>',
};

document.querySelectorAll('[data-icon]').forEach((node) => {
  const icon = ICONS[node.dataset.icon];
  if (icon) node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
});

const STORAGE_KEY = 'studieportalen-data-v2';
const BACKUP_FORMAT = 'studieportalen-backup';
const BACKUP_VERSION = 1;
const MAX_RESOURCE_FILE_BYTES = 25 * 1024 * 1024;
const MAX_BACKUP_FILE_BYTES = 100 * 1024 * 1024;
const MAX_BACKUP_RAW_FILE_BYTES = 70 * 1024 * 1024;
const FILE_RESOURCE_TYPES = ['exam', 'image', 'info'];
const DEFAULT_EVENT_DURATION_MINUTES = { deadline: 60, exam: 240, lecture: 120, seminar: 120, lesson: 120, reading: 60, lab: 120 };
const sampleData = {
  courses: [],
  resources: [],
  events: [],
};

let storageReadFailed = false;
let state = loadState();
let lastSavedState = structuredClone(state);
let currentView = 'overview';
let currentResourceFilter = 'all';
let currentCourseFilter = 'active';
let calendarWeekStart = startOfWeek(new Date());
let selectedCourseId = null;
let addMode = 'resource';
let editingCourseId = null;
let editingResourceId = null;
let editingEventId = null;
let toastTimer;
let pendingUndo = null;
let deferredInstallPrompt = null;
let calendarImportCourseId = null;
let previewedEventId = null;

const els = {
  sidebar: document.querySelector('#sidebar'),
  sidebarBackdrop: document.querySelector('#sidebarBackdrop'),
  menuButton: document.querySelector('#menuButton'),
  globalSearch: document.querySelector('#globalSearch'),
  courseSearch: document.querySelector('#courseSearch'),
  resourceSearch: document.querySelector('#resourceSearch'),
  overviewCourseList: document.querySelector('#overviewCourseList'),
  recentResourceList: document.querySelector('#recentResourceList'),
  upcomingDateList: document.querySelector('#upcomingDateList'),
  courseGrid: document.querySelector('#courseGrid'),
  resourceTableBody: document.querySelector('#resourceTableBody'),
  resourceEmpty: document.querySelector('#resourceEmpty'),
  courseDetail: document.querySelector('#courseDetail'),
  courseResultCount: document.querySelector('#courseResultCount'),
  calendarWeek: document.querySelector('#calendarWeek'),
  calendarWeekScroll: document.querySelector('#calendarWeekScroll'),
  calendarWeekLabel: document.querySelector('#calendarWeekLabel'),
  calendarResultCount: document.querySelector('#calendarResultCount'),
  calendarImportTarget: document.querySelector('#calendarImportTarget'),
  dialog: document.querySelector('#addDialog'),
  form: document.querySelector('#addForm'),
  resourceFields: document.querySelector('#resourceFields'),
  courseFields: document.querySelector('#courseFields'),
  dateFields: document.querySelector('#dateFields'),
  resourceType: document.querySelector('#resourceType'),
  resourceName: document.querySelector('#resourceName'),
  resourceCourse: document.querySelector('#resourceCourse'),
  resourceUrl: document.querySelector('#resourceUrl'),
  resourceFile: document.querySelector('#resourceFile'),
  resourceNote: document.querySelector('#resourceNote'),
  urlField: document.querySelector('#urlField'),
  fileField: document.querySelector('#fileField'),
  noteField: document.querySelector('#noteField'),
  courseName: document.querySelector('#courseName'),
  courseCode: document.querySelector('#courseCode'),
  courseUrl: document.querySelector('#courseUrl'),
  courseHomeUrl: document.querySelector('#courseHomeUrl'),
  courseScheduleUrl: document.querySelector('#courseScheduleUrl'),
  courseDescription: document.querySelector('#courseDescription'),
  universitySelect: document.querySelector('#universitySelect'),
  courseCodeSearch: document.querySelector('#courseCodeSearch'),
  searchCourseButton: document.querySelector('#searchCourseButton'),
  lookupStatus: document.querySelector('#lookupStatus'),
  dateType: document.querySelector('#dateType'),
  dateName: document.querySelector('#dateName'),
  dateCourse: document.querySelector('#dateCourse'),
  dateValue: document.querySelector('#dateValue'),
  dateDuration: document.querySelector('#dateDuration'),
  dateNote: document.querySelector('#dateNote'),
  dialogKicker: document.querySelector('#dialogKicker'),
  dialogTitle: document.querySelector('#dialogTitle'),
  formError: document.querySelector('#formError'),
  toast: document.querySelector('#toast'),
  previewDialog: document.querySelector('#previewDialog'),
  previewTitle: document.querySelector('#previewTitle'),
  previewBody: document.querySelector('#previewBody'),
  eventPreviewDialog: document.querySelector('#eventPreviewDialog'),
  eventPreviewIcon: document.querySelector('#eventPreviewIcon'),
  eventPreviewType: document.querySelector('#eventPreviewType'),
  eventPreviewTitle: document.querySelector('#eventPreviewTitle'),
  eventPreviewContent: document.querySelector('#eventPreviewContent'),
  eventPreviewToggle: document.querySelector('#eventPreviewToggle'),
  eventPreviewEdit: document.querySelector('#eventPreviewEdit'),
  exportButton: document.querySelector('#exportButton'),
  importButton: document.querySelector('#importButton'),
  importInput: document.querySelector('#importInput'),
  calendarImportInput: document.querySelector('#calendarImportInput'),
};

let currentPreviewUrl = '';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(sampleData);
    const saved = JSON.parse(raw);
    const appData = saved && Array.isArray(saved.courses) && Array.isArray(saved.resources)
      ? { ...saved, events: Array.isArray(saved.events) ? saved.events : [] }
      : null;
    return validateBackup({ format: BACKUP_FORMAT, version: BACKUP_VERSION, appData, files: [] }).appData;
  } catch (_) {
    storageReadFailed = true;
    alert('Sparade uppgifter kunde inte läsas och har inte skrivits över. Du kan återställa en giltig säkerhetskopia; övriga ändringar är spärrade tills dess.');
  }
  return structuredClone(sampleData);
}

function saveState({ allowRecovery = false } = {}) {
  try {
    if (storageReadFailed && !allowRecovery) throw new Error('Lagringen kunde inte läsas vid start.');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    lastSavedState = structuredClone(state);
    if (allowRecovery) storageReadFailed = false;
  } catch (error) {
    state = structuredClone(lastSavedState);
    renderAll();
    alert('Ändringen kunde inte sparas. Tidigare uppgifter finns kvar. Kontrollera ledigt utrymme och exportera en säkerhetskopia.');
    throw error;
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function initials(course) {
  return (course.code || course.name.split(/\s+/).map((part) => part[0]).join('')).slice(0, 4).toUpperCase();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function courseFor(resource) {
  return state.courses.find((course) => course.id === resource.courseId);
}

function typeLabel(type) {
  return { exam: 'Tenta', image: 'Bild', link: 'Länk', note: 'Anteckning', info: 'Information' }[type] || 'Resurs';
}

function typeIcon(type) {
  return type === 'exam' ? 'file' : type;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function settlePendingUndo() {
  if (!pendingUndo) return;
  const action = pendingUndo;
  pendingUndo = null;
  clearTimeout(action.timer);
  return Promise.resolve(action.onExpire?.()).catch(() => {});
}

function showToast(message) {
  settlePendingUndo();
  clearTimeout(toastTimer);
  els.toast.replaceChildren(document.createTextNode(message));
  els.toast.classList.remove('with-action');
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function showUndoToast(message, onUndo, onExpire) {
  settlePendingUndo();
  clearTimeout(toastTimer);
  const text = document.createElement('span');
  text.textContent = message;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'toast-action';
  button.textContent = 'Ångra';
  els.toast.replaceChildren(text, button);
  els.toast.classList.add('show', 'with-action');

  const action = { onExpire, timer: 0 };
  action.timer = setTimeout(() => {
    if (pendingUndo !== action) return;
    pendingUndo = null;
    Promise.resolve(onExpire?.()).catch(() => {});
    els.toast.classList.remove('show', 'with-action');
  }, 6500);
  pendingUndo = action;

  button.addEventListener('click', () => {
    if (pendingUndo !== action) return;
    clearTimeout(action.timer);
    pendingUndo = null;
    onUndo();
    showToast('Borttagningen har ångrats');
  }, { once: true });
}

function emptyMarkup(title, text) {
  return `<div class="empty-icon"><span data-icon="folder">${svg('folder')}</span></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>`;
}

function svg(name) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function renderAll() {
  renderCounts();
  renderCourseSelect();
  renderOverview();
  renderCourses();
  renderResources();
  renderCalendar();
  if (selectedCourseId) renderCourseDetail(selectedCourseId);
}

function renderCounts() {
  document.querySelector('#courseCount').textContent = state.courses.filter((course) => !course.archived).length;
  document.querySelector('#examCount').textContent = state.resources.filter((r) => r.type === 'exam').length;
  document.querySelector('#imageCount').textContent = state.resources.filter((r) => r.type === 'image').length;
  document.querySelector('#dateCount').textContent = state.events.filter((event) => !event.completed && new Date(event.date) >= new Date()).length;
}

function renderOverview() {
  const courses = state.courses.filter((course) => !course.archived);
  els.overviewCourseList.innerHTML = courses.length
    ? courses.map((course) => {
      const count = state.resources.filter((r) => r.courseId === course.id).length;
      return `<article class="course-row" tabindex="0" data-course-id="${course.id}">
        <span class="course-badge ${course.color}">${escapeHtml(initials(course))}</span>
        <div><strong>${escapeHtml(course.name)}</strong><small>${escapeHtml(course.code || 'Ingen kurskod')}</small></div>
        <span class="resource-count">${count} ${count === 1 ? 'resurs' : 'resurser'}</span><span class="row-arrow">→</span>
      </article>`;
    }).join('')
    : `<div class="empty-state">${emptyMarkup('Inga kurser ännu', 'Skapa din första kurs för att komma igång.')}</div>`;

  const recent = [...state.resources].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  els.recentResourceList.innerHTML = recent.length
    ? recent.map((resource) => {
      const course = courseFor(resource);
      return `<article class="recent-item"><span class="resource-icon ${resource.type}">${svg(typeIcon(resource.type))}</span>
        <div><strong>${escapeHtml(resource.name)}</strong><small>${escapeHtml(course?.name || 'Allmänt')} · ${formatDate(resource.createdAt)}</small></div>
        <button class="open-mini" data-open-resource="${resource.id}" aria-label="Öppna ${escapeHtml(resource.name)}">${svg('external')}</button></article>`;
    }).join('')
    : `<div class="empty-state">${emptyMarkup('Inga resurser ännu', 'Lägg till information, en tenta, bild, länk eller anteckning.')}</div>`;

  const upcoming = [...state.events]
    .filter((item) => !item.completed && new Date(item.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);
  els.upcomingDateList.innerHTML = upcoming.length
    ? upcoming.map((item) => dateItemMarkup(item)).join('')
    : `<div class="empty-state">${emptyMarkup('Inget planerat', 'Lägg till en uppgift, deadline eller tentamen.')}</div>`;

  const hasCourses = state.courses.some((course) => !course.archived);
  document.querySelector('#focusTitle').textContent = hasCourses ? 'Bygg din kunskapsbank' : 'Börja med din första kurs';
  document.querySelector('#focusText').textContent = hasCourses ? 'Lägg in en gammal tenta, en bra kurslänk eller bilder från dagens föreläsning.' : 'Sök på kurskoden och hämta kursinformationen automatiskt.';
  document.querySelector('#focusAddButton').textContent = hasCourses ? 'Lägg till resurs' : 'Sök kurs';
}

function dateItemMarkup(item) {
  const date = new Date(item.date);
  const course = state.courses.find((courseItem) => courseItem.id === item.courseId);
  const month = new Intl.DateTimeFormat('sv-SE', { month: 'short' }).format(date).replace('.', '');
  const time = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(date);
  const timeRange = `${time}–${formatTime(calendarEventEnd(item))}`;
  const label = eventTypeLabel(item.type);
  const context = course ? `<button type="button" class="event-course-link" data-open-event-course="${course.id}">${escapeHtml(course.name)}</button>` : '<span>Allmänt</span>';
  return `<article class="recent-item${item.completed ? ' completed' : ''}"><span class="date-day">${date.getDate()}<small>${month}</small></span><div><strong>${escapeHtml(item.name)}</strong><small class="event-meta">${context}<span class="event-time">${timeRange}</span></small>${item.note ? `<small class="event-note">${escapeHtml(item.note)}</small>` : ''}<span class="date-chip ${item.type}">${label}${item.completed ? ' · Klar' : ''}</span></div><div class="item-actions"><button class="open-mini" data-edit-event="${item.id}" aria-label="Redigera ${escapeHtml(item.name)}">${svg('edit')}</button><button class="open-mini complete-event${item.completed ? ' completed' : ''}" data-toggle-event="${item.id}" aria-label="${item.completed ? 'Markera som att göra' : 'Markera som klar'}">${svg('check')}</button><button class="open-mini delete-event" data-delete-event="${item.id}" aria-label="Ta bort planering">${svg('trash')}</button></div></article>`;
}

function startOfWeek(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function sameLocalDay(first, second) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

function formatTime(value) {
  return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(value);
}

function eventDurationMinutes(item) {
  const start = new Date(item.date);
  const savedEnd = item.endDate ? new Date(item.endDate) : null;
  if (savedEnd && !Number.isNaN(savedEnd.getTime()) && savedEnd > start) return Math.max(1, Math.round((savedEnd - start) / 60000));
  return DEFAULT_EVENT_DURATION_MINUTES[item.type] || 60;
}

function calendarEventEnd(item) {
  const start = new Date(item.date);
  return new Date(start.getTime() + eventDurationMinutes(item) * 60000);
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} tim ${remainder} min` : `${hours} ${hours === 1 ? 'timme' : 'timmar'}`;
}

function isoWeekNumber(value) {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function calendarWeekRangeLabel(start) {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const startText = new Intl.DateTimeFormat('sv-SE', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' }).format(start).replace('.', '');
  const endText = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) }).format(end);
  return `Vecka ${isoWeekNumber(start)} · ${startText}–${endText}${sameYear ? ` ${end.getFullYear()}` : ''}`;
}

function renderCalendar() {
  const weekEnd = addDays(calendarWeekStart, 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(calendarWeekStart, index));
  const events = [...state.events]
    .filter((item) => {
      const date = new Date(item.date);
      return date >= calendarWeekStart && date < weekEnd;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const startHour = 8;
  const endHour = 24;
  const slotsPerHour = 4;
  const slotCount = (endHour - startHour) * slotsPerHour;
  const now = new Date();

  els.calendarWeekLabel.textContent = calendarWeekRangeLabel(calendarWeekStart);
  els.calendarResultCount.textContent = `${events.length} ${events.length === 1 ? 'post' : 'poster'}`;
  const headers = days.map((day) => `<div class="calendar-day-heading${sameLocalDay(day, now) ? ' today' : ''}"><span>${new Intl.DateTimeFormat('sv-SE', { weekday: 'short' }).format(day).replace('.', '')}</span><strong>${day.getDate()}</strong></div>`).join('');
  const timeLabels = Array.from({ length: endHour - startHour }, (_, index) => `<span class="calendar-start-${index * slotsPerHour}">${String(startHour + index).padStart(2, '0')}:00</span>`).join('');
  const columns = days.map((day) => {
    const dayItems = events.filter((item) => sameLocalDay(new Date(item.date), day));
    const blocks = dayItems.map((item) => {
      const start = new Date(item.date);
      const end = calendarEventEnd(item);
      const course = state.courses.find((candidate) => candidate.id === item.courseId);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getDate() === start.getDate() ? end.getHours() * 60 + end.getMinutes() : endHour * 60;
      const startSlot = Math.max(0, Math.min(slotCount - 1, Math.floor((startMinutes - startHour * 60) / 15)));
      const durationSlots = Math.max(2, Math.min(slotCount - startSlot, Math.ceil((endMinutes - Math.max(startMinutes, startHour * 60)) / 15)));
      const time = `${formatTime(start)}–${formatTime(end)}`;
      return `<button type="button" class="calendar-event ${item.type} calendar-start-${startSlot} calendar-span-${durationSlots}${item.completed ? ' completed' : ''}" data-preview-event="${item.id}" aria-label="Visa information om ${escapeHtml(item.name)}, ${time}"><strong>${escapeHtml(item.name)}</strong><span>${time}</span><small>${escapeHtml(course?.code || course?.name || 'Allmänt')}</small></button>`;
    }).join('');
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    const currentLine = sameLocalDay(day, now) && currentMinute >= startHour * 60 && currentMinute <= endHour * 60
      ? `<div class="calendar-current-time calendar-start-${Math.min(slotCount - 1, Math.floor((currentMinute - startHour * 60) / 15))}" aria-label="Nu, ${formatTime(now)}"><span></span></div>`
      : '';
    return `<div class="calendar-day-column${sameLocalDay(day, now) ? ' today' : ''}">${blocks}${currentLine}</div>`;
  }).join('');
  els.calendarWeek.innerHTML = `<div class="week-calendar"><div class="calendar-week-header"><div class="calendar-time-corner">Tid</div>${headers}</div><div class="calendar-week-body"><div class="calendar-time-axis">${timeLabels}</div><div class="calendar-day-columns">${columns}</div></div></div>`;
}

function renderCourses() {
  const query = els.courseSearch.value.trim().toLocaleLowerCase('sv');
  const courses = state.courses
    .filter((course) => currentCourseFilter === 'all' || (currentCourseFilter === 'archived' ? course.archived : !course.archived))
    .filter((course) => `${course.name} ${course.code} ${course.description}`.toLocaleLowerCase('sv').includes(query));
  const emptyTitle = query ? 'Ingen kurs hittades' : currentCourseFilter === 'archived' ? 'Inga arkiverade kurser' : currentCourseFilter === 'active' ? 'Inga aktiva kurser' : 'Inga kurser ännu';
  const emptyText = query ? 'Prova ett annat sökord.' : currentCourseFilter === 'archived' ? 'Kurser du arkiverar visas här.' : currentCourseFilter === 'active' ? 'Skapa en ny kurs eller återaktivera en arkiverad kurs.' : 'Skapa din första kurs för att börja samla material.';
  els.courseResultCount.textContent = `${courses.length} ${courses.length === 1 ? 'kurs' : 'kurser'}`;
  els.courseGrid.innerHTML = courses.length
    ? courses.map((course) => {
      const count = state.resources.filter((r) => r.courseId === course.id).length;
      const peers = state.courses.filter((item) => Boolean(item.archived) === Boolean(course.archived));
      const peerIndex = peers.findIndex((item) => item.id === course.id);
      return `<article class="course-card${course.archived ? ' archived' : ''}">
        <div class="course-card-top"><span class="course-badge ${course.color}">${escapeHtml(initials(course))}</span><span class="course-code">${escapeHtml(course.code || 'KURS')}${course.archived ? ' · ARKIVERAD' : ''}</span><span class="course-order-actions"><button type="button" data-move-course="${course.id}" data-move-direction="up" aria-label="Flytta ${escapeHtml(course.name)} uppåt"${peerIndex === 0 ? ' disabled' : ''}>${svg('up')}</button><button type="button" data-move-course="${course.id}" data-move-direction="down" aria-label="Flytta ${escapeHtml(course.name)} nedåt"${peerIndex === peers.length - 1 ? ' disabled' : ''}>${svg('down')}</button></span></div>
        <h3>${escapeHtml(course.name)}</h3><p>${escapeHtml(course.description || 'Ingen beskrivning ännu.')}</p>
        <div class="course-card-foot"><span>${count} ${count === 1 ? 'resurs' : 'resurser'}</span><button class="course-open" data-course-id="${course.id}">Öppna →</button></div>
      </article>`;
    }).join('')
    : `<div class="empty-state course-grid-empty">${emptyMarkup(emptyTitle, emptyText)}</div>`;
}

function renderResources() {
  const query = els.resourceSearch.value.trim().toLocaleLowerCase('sv');
  const resources = [...state.resources]
    .filter((resource) => currentResourceFilter === 'all' || resource.type === currentResourceFilter)
    .filter((resource) => {
      const course = courseFor(resource);
      return `${resource.name} ${course?.name || ''} ${course?.code || ''} ${typeLabel(resource.type)}`.toLocaleLowerCase('sv').includes(query);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  els.resourceTableBody.innerHTML = resources.map((resource) => {
    const course = courseFor(resource);
    return `<tr><td><div class="resource-name-cell"><span class="resource-icon ${resource.type}">${svg(typeIcon(resource.type))}</span><strong>${escapeHtml(resource.name)}</strong></div></td>
      <td>${escapeHtml(course?.name || 'Allmänt')}</td><td><span class="type-chip ${resource.type}">${typeLabel(resource.type)}</span></td>
      <td>${formatDate(resource.createdAt)}</td><td><div class="table-actions"><button data-open-resource="${resource.id}" aria-label="Öppna ${escapeHtml(resource.name)}">${svg('external')}</button><button data-edit-resource="${resource.id}" aria-label="Redigera ${escapeHtml(resource.name)}">${svg('edit')}</button><button class="delete-button" data-delete-resource="${resource.id}" aria-label="Ta bort ${escapeHtml(resource.name)}">${svg('trash')}</button></div></td></tr>`;
  }).join('');
  els.resourceEmpty.classList.toggle('hidden', resources.length > 0);
  if (!resources.length) els.resourceEmpty.innerHTML = emptyMarkup(query ? 'Ingen resurs hittades' : 'Inga resurser här', query ? 'Prova ett annat sökord eller filter.' : 'Lägg till ditt första material.');
}

function renderCourseSelect() {
  const activeCourses = state.courses.filter((course) => !course.archived);
  const options = `<option value="">Allmänt · ingen kurs</option>${activeCourses
    .map((course) => `<option value="${course.id}">${escapeHtml(course.name)}${course.code ? ` (${escapeHtml(course.code)})` : ''}</option>`).join('')}`;
  els.resourceCourse.innerHTML = options;
  els.dateCourse.innerHTML = options;
  const importTarget = els.calendarImportTarget.value;
  els.calendarImportTarget.innerHTML = options;
  if ([...els.calendarImportTarget.options].some((option) => option.value === importTarget)) els.calendarImportTarget.value = importTarget;
}

function renderCourseDetail(courseId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) return;
  const resources = state.resources.filter((resource) => resource.courseId === course.id);
  const events = state.events.filter((event) => event.courseId === course.id).sort((a, b) => new Date(a.date) - new Date(b.date));
  els.courseDetail.innerHTML = `<div class="course-detail-hero"><span class="course-badge ${course.color}">${escapeHtml(initials(course))}</span><div><h1>${escapeHtml(course.name)}</h1><p>${escapeHtml(course.code || 'Ingen kurskod')} · ${escapeHtml(course.universityName || '')}${course.archived ? ' · Arkiverad' : ''}</p></div><div class="course-hero-actions"><button class="secondary-button" data-edit-course="${course.id}">${svg('edit')} Redigera</button><button class="secondary-button" data-toggle-course-archive="${course.id}">${svg('archive')} ${course.archived ? 'Återaktivera' : 'Arkivera'}</button>${course.archived ? '' : `<button class="primary-button" data-add-resource-course="${course.id}">${svg('plus')} Lägg till resurs</button>`}</div></div>
    <div class="course-detail-body"><div class="course-detail-main"><section class="panel"><div class="panel-heading"><div><p class="section-kicker">MATERIAL</p><h2>Kursresurser</h2></div><span class="result-count">${resources.length} st</span></div>
      <div class="recent-list">${resources.length ? resources.map((resource) => `<article class="recent-item"><span class="resource-icon ${resource.type}">${svg(typeIcon(resource.type))}</span><div><strong>${escapeHtml(resource.name)}</strong><small>${typeLabel(resource.type)} · ${formatDate(resource.createdAt)}</small></div><div class="item-actions"><button class="open-mini" data-open-resource="${resource.id}" aria-label="Öppna ${escapeHtml(resource.name)}">${svg('external')}</button><button class="open-mini" data-edit-resource="${resource.id}" aria-label="Redigera ${escapeHtml(resource.name)}">${svg('edit')}</button></div></article>`).join('') : `<div class="empty-state">${emptyMarkup('Inget material ännu', 'Lägg till information, en tenta, bild, länk eller anteckning.')}</div>`}</div></section>
      <section class="panel"><div class="panel-heading"><div><p class="section-kicker">PLANERING</p><h2>Uppgifter och viktiga datum</h2></div><div class="panel-heading-actions"><button class="secondary-button compact" data-import-calendar-course="${course.id}">${svg('upload')} Importera kalender</button><button class="icon-button" data-add-date-course="${course.id}" aria-label="Lägg till planering">${svg('plus')}</button></div></div><div class="recent-list">${events.length ? events.map((event) => dateItemMarkup(event)).join('') : `<div class="empty-state">${emptyMarkup('Inget planerat ännu', 'Lägg till en uppgift, deadline, laboration eller tentamen.')}</div>`}</div></section></div>
      <aside class="panel"><div class="panel-heading"><div><p class="section-kicker">OM KURSEN</p><h2>Information</h2></div></div><p class="course-info-text">${escapeHtml(course.description || 'Ingen beskrivning ännu.')}</p><div class="course-links">${course.courseHomeUrl ? `<a class="external-link" href="${escapeHtml(course.courseHomeUrl)}" target="_blank" rel="noopener">Kurshemsida och uppgifter ${svg('external')}</a>` : ''}${course.url ? `<a class="external-link" href="${escapeHtml(course.url)}" target="_blank" rel="noopener">Officiell kursinformation ${svg('external')}</a>` : ''}${course.scheduleUrl ? `<div class="schedule-link-row"><a class="external-link" href="${escapeHtml(course.scheduleUrl)}" target="_blank" rel="noopener">Öppna schema eller kalender ${svg('calendar')}</a>${course.code ? `<button type="button" class="copy-course-code" data-copy-course-code="${escapeHtml(course.code)}">Kopiera ${escapeHtml(course.code)}</button>` : ''}</div>` : ''}${!course.courseHomeUrl && !course.url && !course.scheduleUrl ? '<p class="course-info-text">Inga kurslänkar tillagda.</p>' : ''}</div><div class="course-delete-area"><button class="text-button delete-course" data-delete-course="${course.id}">Ta bort kurs</button></div></aside></div>`;
}

function switchView(view, { updateHash = true, preserveFocus = false } = {}) {
  currentView = view;
  document.querySelectorAll('[data-view-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === view));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view || (view === 'course-detail' && item.dataset.view === 'courses')));
  if (updateHash) history.replaceState(null, '', `#${view === 'course-detail' ? 'courses' : view}`);
  closeSidebar();
  if (!preserveFocus) document.querySelector('#mainContent').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCourse(courseId) {
  selectedCourseId = courseId;
  renderCourseDetail(courseId);
  switchView('course-detail');
}

function openDialog(mode = 'resource', courseId = '') {
  editingCourseId = null;
  editingResourceId = null;
  editingEventId = null;
  setAddMode(mode);
  els.form.reset();
  els.dialogKicker.textContent = 'LÄGG TILL';
  els.formError.textContent = '';
  els.lookupStatus.textContent = '';
  els.lookupStatus.className = 'lookup-status';
  if (mode === 'date') {
    const start = new Date();
    start.setSeconds(0, 0);
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30);
    els.dateValue.value = toLocalDateTimeValue(start);
    setDurationValue(DEFAULT_EVENT_DURATION_MINUTES[els.dateType.value] || 60);
  }
  if (courseId) {
    els.resourceCourse.value = courseId;
    els.dateCourse.value = courseId;
  }
  document.querySelector('input[name="courseColor"][value="purple"]').checked = true;
  document.querySelector('.file-drop strong').textContent = 'Välj en fil från datorn';
  updateResourceFields();
  els.dialog.showModal();
  (mode === 'course' ? els.courseCodeSearch : mode === 'date' ? els.dateName : els.resourceName).focus();
}

function editCourse(courseId) {
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) return;
  openDialog('course');
  editingCourseId = course.id;
  els.dialogKicker.textContent = 'REDIGERA';
  els.dialogTitle.textContent = 'Redigera kurs';
  els.universitySelect.value = [...els.universitySelect.options].some((option) => option.value === course.university) ? course.university : 'other';
  els.courseCodeSearch.value = course.code || '';
  els.courseName.value = course.name || '';
  els.courseCode.value = course.code || '';
  els.courseUrl.value = course.url || '';
  els.courseHomeUrl.value = course.courseHomeUrl || '';
  els.courseScheduleUrl.value = course.scheduleUrl || '';
  els.courseDescription.value = course.description || '';
  const color = document.querySelector(`input[name="courseColor"][value="${course.color}"]`);
  if (color) color.checked = true;
}

function ensureCourseCanBeSelected(select, courseId) {
  if ([...select.options].some((option) => option.value === courseId)) return;
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) return;
  const option = document.createElement('option');
  option.value = course.id;
  option.textContent = `${course.name}${course.code ? ` (${course.code})` : ''} · Arkiverad`;
  select.append(option);
}

function editResource(resourceId) {
  const resource = state.resources.find((item) => item.id === resourceId);
  if (!resource) return;
  openDialog('resource');
  editingResourceId = resource.id;
  els.dialogKicker.textContent = 'REDIGERA';
  els.dialogTitle.textContent = 'Redigera resurs';
  ensureCourseCanBeSelected(els.resourceCourse, resource.courseId);
  els.resourceType.value = resource.type;
  els.resourceName.value = resource.name || '';
  els.resourceCourse.value = resource.courseId || '';
  els.resourceUrl.value = resource.url || '';
  els.resourceNote.value = resource.note || '';
  updateResourceFields();
  if (resource.fileName) document.querySelector('.file-drop strong').textContent = `Behåll ${resource.fileName} eller välj en ny fil`;
  setTimeout(() => els.resourceName.focus(), 40);
}

function toLocalDateTimeValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function setDurationValue(minutes) {
  els.dateDuration.querySelector('[data-custom-duration]')?.remove();
  const value = String(Math.max(1, Math.round(minutes)));
  if (![...els.dateDuration.options].some((option) => option.value === value)) {
    const option = document.createElement('option');
    option.value = value;
    option.dataset.customDuration = 'true';
    option.textContent = `${formatDuration(Number(value))} · importerad tid`;
    els.dateDuration.append(option);
  }
  els.dateDuration.value = value;
}

function useDefaultDuration() {
  setDurationValue(DEFAULT_EVENT_DURATION_MINUTES[els.dateType.value] || 60);
}

function editEvent(eventId) {
  const item = state.events.find((event) => event.id === eventId);
  if (!item) return;
  openDialog('date');
  editingEventId = item.id;
  els.dialogKicker.textContent = 'REDIGERA';
  els.dialogTitle.textContent = 'Redigera planering';
  ensureCourseCanBeSelected(els.dateCourse, item.courseId);
  els.dateType.value = item.type;
  els.dateName.value = item.name || '';
  els.dateCourse.value = item.courseId || '';
  els.dateValue.value = toLocalDateTimeValue(item.date);
  setDurationValue(eventDurationMinutes(item));
  els.dateNote.value = item.note || '';
  setTimeout(() => els.dateName.focus(), 40);
}

function setAddMode(mode) {
  addMode = mode;
  els.resourceFields.classList.toggle('hidden', mode !== 'resource');
  els.dateFields.classList.toggle('hidden', mode !== 'date');
  els.courseFields.classList.toggle('hidden', mode !== 'course');
  els.dialogTitle.textContent = mode === 'resource' ? 'Ny resurs' : mode === 'date' ? 'Ny planeringspost' : 'Ny kurs';
  document.querySelectorAll('.mode-option').forEach((button) => button.classList.toggle('active', button.dataset.addMode === mode));
}

function updateResourceFields() {
  const type = els.resourceType.value;
  els.urlField.classList.toggle('hidden', !['link', 'info'].includes(type));
  els.fileField.classList.toggle('hidden', !FILE_RESOURCE_TYPES.includes(type));
  els.noteField.classList.toggle('hidden', !['note', 'info'].includes(type));
  document.querySelector('#resourceNoteLabel').textContent = type === 'info' ? 'Beskrivning' : 'Anteckning';
  els.resourceNote.placeholder = type === 'info' ? 'Beskriv materialet eller skriv viktig information…' : 'Skriv din anteckning…';
  els.resourceFile.accept = type === 'image' ? 'image/*' : type === 'info' ? '.pdf,.doc,.docx,.txt,.md' : type === 'exam' ? '.pdf,.doc,.docx' : '';
}

async function handleSubmit(event) {
  event.preventDefault();
  els.formError.textContent = '';
  if (addMode === 'date') {
    const name = els.dateName.value.trim();
    if (!name) return showFormError('Skriv ett namn på datumet.');
    if (!els.dateValue.value) return showFormError('Välj datum och tid.');
    const startDate = new Date(els.dateValue.value);
    if (Number.isNaN(startDate.getTime())) return showFormError('Välj ett giltigt startdatum.');
    const durationMinutes = Number(els.dateDuration.value);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 10080) return showFormError('Välj en giltig längd.');
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const existing = editingEventId ? state.events.find((item) => item.id === editingEventId) : null;
    const planItem = { id: existing?.id || uid('event'), type: els.dateType.value, name, courseId: els.dateCourse.value, date: startDate.toISOString(), endDate: endDate.toISOString(), note: els.dateNote.value.trim(), completed: existing?.completed || false, createdAt: existing?.createdAt || new Date().toISOString() };
    if (editingEventId && !existing) return showFormError('Planeringsposten kunde inte hittas.');
    if (existing) Object.assign(existing, planItem);
    else state.events.push(planItem);
    editingEventId = null;
    saveState(); renderAll(); els.dialog.close(); showToast(existing ? 'Planeringen har uppdaterats' : 'Planeringen har lagts till');
    return;
  }
  if (addMode === 'course') {
    const name = els.courseName.value.trim();
    if (!name) return showFormError('Skriv ett kursnamn.');
    const course = {
      id: uid('course'), name, code: els.courseCode.value.trim().toUpperCase(),
      description: els.courseDescription.value.trim(), url: normalizeUrl(els.courseUrl.value.trim()),
      courseHomeUrl: normalizeUrl(els.courseHomeUrl.value.trim()),
      scheduleUrl: normalizeUrl(els.courseScheduleUrl.value.trim()),
      university: els.universitySelect.value,
      universityName: els.universitySelect.options[els.universitySelect.selectedIndex].text,
      color: document.querySelector('input[name="courseColor"]:checked').value, createdAt: new Date().toISOString(),
    };
    if (els.courseUrl.value.trim() && !course.url) return showFormError('Kontrollera adressen till kursinformationen.');
    if (els.courseHomeUrl.value.trim() && !course.courseHomeUrl) return showFormError('Kontrollera kurshemsidans adress.');
    if (els.courseScheduleUrl.value.trim() && !course.scheduleUrl) return showFormError('Kontrollera schemalänkens adress.');
    if (editingCourseId) {
      const existing = state.courses.find((item) => item.id === editingCourseId);
      if (!existing) return showFormError('Kursen kunde inte hittas.');
      Object.assign(existing, course, { id: existing.id, archived: Boolean(existing.archived), createdAt: existing.createdAt });
      editingCourseId = null;
      saveState(); renderAll(); els.dialog.close(); showToast('Kursen har uppdaterats');
      return;
    }
    state.courses.unshift({ ...course, archived: false });
    saveState(); renderAll(); els.dialog.close(); showToast('Kursen har lagts till'); switchView('courses');
    return;
  }

  const name = els.resourceName.value.trim();
  if (!name) return showFormError('Skriv ett namn på resursen.');
  const type = els.resourceType.value;
  const url = normalizeUrl(els.resourceUrl.value.trim());
  if (type === 'link' && !url) return showFormError('Lägg till en giltig webbadress.');
  if (type === 'info' && els.resourceUrl.value.trim() && !url) return showFormError('Kontrollera webbadressen.');
  if (type === 'note' && !els.resourceNote.value.trim()) return showFormError('Skriv en anteckning.');
  if (type === 'info' && !els.resourceNote.value.trim()) return showFormError('Skriv en kort beskrivning av informationen.');
  const existing = editingResourceId ? state.resources.find((item) => item.id === editingResourceId) : null;
  if (editingResourceId && !existing) return showFormError('Resursen kunde inte hittas.');
  const file = els.resourceFile.files[0];
  if (file?.size > MAX_RESOURCE_FILE_BYTES) return showFormError('Filen är för stor. Maximal storlek är 25 MB.');
  const keepsExistingFile = existing && existing.type === type && FILE_RESOURCE_TYPES.includes(type) && existing.fileName;
  if (['exam', 'image'].includes(type) && !file && !keepsExistingFile) return showFormError('Välj en fil från datorn.');
  const resource = {
    id: existing?.id || uid('resource'), name, courseId: els.resourceCourse.value, type, url,
    note: els.resourceNote.value.trim(), fileName: file?.name || (keepsExistingFile ? existing.fileName : ''), createdAt: existing?.createdAt || new Date().toISOString(), sample: false,
  };
  const previousFile = existing?.fileName && file ? await getFile(existing.id) : null;
  if (existing?.fileName && file && !previousFile) return showFormError('Den tidigare filen kunde inte läsas. Ingen ändring har gjorts.');
  if (file) {
    try { await storeFile(resource.id, file); }
    catch (_) { return showFormError('Filen kunde inte sparas. Försök igen.'); }
  }
  const obsoleteFileId = existing && !file && existing.fileName && !keepsExistingFile ? existing.id : null;
  if (existing) Object.assign(existing, resource);
  else state.resources.unshift(resource);
  try { saveState(); }
  catch (_) {
    if (file && previousFile) await storeFile(resource.id, previousFile);
    else if (file) await removeFile(resource.id);
    return showFormError('Resursen kunde inte sparas. Kontrollera ledigt utrymme.');
  }
  if (obsoleteFileId) await removeFile(obsoleteFileId);
  editingResourceId = null;
  renderAll(); els.dialog.close(); showToast(existing ? 'Resursen har uppdaterats' : 'Resursen har sparats');
}

async function searchCourse() {
  const code = els.courseCodeSearch.value.trim().toUpperCase();
  const university = els.universitySelect.value;
  els.lookupStatus.className = 'lookup-status';
  if (!/^[A-ZÅÄÖ0-9-]{3,16}$/.test(code)) {
    els.lookupStatus.textContent = 'Skriv en giltig kurskod.';
    els.lookupStatus.classList.add('error');
    return;
  }
  if (university === 'other') {
    els.courseCode.value = code;
    els.lookupStatus.textContent = 'Fyll i kursnamn och kurshemsida nedan. Automatisk hämtning byggs ut lärosäte för lärosäte.';
    return;
  }
  els.searchCourseButton.disabled = true;
  els.searchCourseButton.textContent = 'Söker…';
  els.lookupStatus.textContent = 'Hämtar från universitetets officiella kurskatalog…';
  try {
    const response = await fetch(`/api/course-search?university=${encodeURIComponent(university)}&q=${encodeURIComponent(code)}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.course) throw new Error(data.message || 'Kursen hittades inte.');
    const course = data.course;
    els.courseName.value = course.name || '';
    els.courseCode.value = course.code || code;
    els.courseUrl.value = course.url || '';
    els.courseHomeUrl.value = course.courseHomeUrl || '';
    els.courseScheduleUrl.value = course.scheduleUrl || '';
    els.courseDescription.value = course.description || '';
    els.lookupStatus.textContent = `${course.code} · ${course.name}${course.credits ? ` · ${course.credits}` : ''} hittades.${course.courseHomeUrl || course.scheduleUrl ? ' Kursplattform och schema lades till när de finns.' : ''}`;
    els.lookupStatus.classList.add('success');
  } catch (error) {
    els.courseCode.value = code;
    els.lookupStatus.textContent = `${error.message || 'Kursen kunde inte hämtas.'} Du kan ändå fylla i uppgifterna själv nedan.`;
    els.lookupStatus.classList.add('error');
  } finally {
    els.searchCourseButton.disabled = false;
    els.searchCourseButton.textContent = 'Sök';
  }
}

function showFormError(message) {
  els.formError.textContent = message;
}

function normalizeUrl(value) {
  if (!value) return '';
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (_) { return ''; }
}

async function copyCourseCode(code) {
  try {
    await navigator.clipboard.writeText(code);
  } catch (_) {
    const helper = document.createElement('textarea');
    helper.className = 'clipboard-helper';
    helper.value = code;
    helper.readOnly = true;
    document.body.append(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }
  showToast(`${code} har kopierats`);
}

async function openResource(id) {
  const resource = state.resources.find((item) => item.id === id);
  if (!resource) return;
  const file = resource.fileName ? await getFile(id) : null;
  if (file) {
    const fileUrl = URL.createObjectURL(file);
    currentPreviewUrl = fileUrl;
    const content = resource.type === 'image'
      ? `<img src="${fileUrl}" alt="${escapeHtml(resource.name)}" />`
      : `<iframe ${file.type === 'application/pdf' ? '' : 'sandbox=""'} src="${fileUrl}" title="${escapeHtml(resource.name)}"></iframe>`;
    showResourcePreview(resource, content);
    return;
  }
  if (resource.url) {
    window.open(resource.url, '_blank', 'noopener');
    return;
  }
  if (['note', 'info'].includes(resource.type)) {
    showResourcePreview(resource, `<article class="note-preview">${escapeHtml(resource.note || 'Informationen är tom.')}</article>`);
    return;
  }
  showToast(resource.sample ? 'Detta är exempeldata – lägg till din egen fil eller länk' : 'Filen kunde inte hittas');
}

function showResourcePreview(resource, content) {
  els.previewTitle.textContent = resource.name;
  els.previewBody.innerHTML = content;
  els.previewDialog.showModal();
}

function closeResourcePreview() {
  els.previewDialog.close();
  els.previewBody.innerHTML = '';
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = '';
}

function showEventPreview(id) {
  const item = state.events.find((event) => event.id === id);
  if (!item) return;
  const start = new Date(item.date);
  const end = calendarEventEnd(item);
  const course = state.courses.find((candidate) => candidate.id === item.courseId);
  const dateText = new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(start);
  const duration = eventDurationMinutes(item);
  previewedEventId = item.id;
  els.eventPreviewIcon.className = `event-preview-icon ${item.type}`;
  els.eventPreviewType.textContent = eventTypeLabel(item.type).toLocaleUpperCase('sv-SE');
  els.eventPreviewTitle.textContent = item.name;
  els.eventPreviewContent.innerHTML = `<div class="event-preview-row">${svg('calendar')}<div><strong>${escapeHtml(dateText)}</strong><span>${formatTime(start)}–${formatTime(end)} · ${escapeHtml(formatDuration(duration))}</span></div></div>
    <div class="event-preview-row">${svg('book')}<div><strong>Kurs</strong>${course ? `<button type="button" class="event-preview-course" data-open-event-course="${course.id}">${escapeHtml(course.name)}${course.code ? ` · ${escapeHtml(course.code)}` : ''}</button>` : '<span>Allmänt · ingen kurs</span>'}</div></div>
    ${item.note ? `<div class="event-preview-row event-preview-note">${svg('info')}<div><strong>Information</strong><p>${escapeHtml(item.note)}</p></div></div>` : ''}
    <div class="event-preview-status${item.completed ? ' completed' : ''}">${item.completed ? 'Markerad som klar' : 'Planerad'}</div>`;
  els.eventPreviewToggle.textContent = item.completed ? 'Markera som att göra' : 'Markera som klar';
  if (!els.eventPreviewDialog.open) els.eventPreviewDialog.showModal();
}

function closeEventPreview() {
  if (els.eventPreviewDialog.open) els.eventPreviewDialog.close();
  previewedEventId = null;
}

async function deleteResource(id) {
  const resource = state.resources.find((item) => item.id === id);
  if (!resource || !confirm(`Ta bort “${resource.name}”?`)) return;
  const index = state.resources.indexOf(resource);
  state.resources.splice(index, 1);
  saveState(); renderAll();
  showUndoToast('Resursen har tagits bort', () => {
    state.resources.splice(Math.min(index, state.resources.length), 0, resource);
    saveState(); renderAll();
  }, () => removeFile(id));
}

async function deleteCourse(id) {
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  const resources = state.resources.map((item, index) => ({ item, index })).filter(({ item }) => item.courseId === id);
  const events = state.events.map((item, index) => ({ item, index })).filter(({ item }) => item.courseId === id);
  if (!confirm(`Ta bort “${course.name}” och ${resources.length} tillhörande resurser?`)) return;
  const courseIndex = state.courses.indexOf(course);
  state.courses.splice(courseIndex, 1);
  state.resources = state.resources.filter((item) => item.courseId !== id);
  state.events = state.events.filter((item) => item.courseId !== id);
  saveState();
  selectedCourseId = null; renderAll(); switchView('courses');
  showUndoToast('Kursen har tagits bort', () => {
    state.courses.splice(Math.min(courseIndex, state.courses.length), 0, course);
    resources.sort((a, b) => a.index - b.index).forEach(({ item, index }) => state.resources.splice(Math.min(index, state.resources.length), 0, item));
    events.sort((a, b) => a.index - b.index).forEach(({ item, index }) => state.events.splice(Math.min(index, state.events.length), 0, item));
    saveState(); renderAll();
  }, () => Promise.all(resources.map(({ item }) => removeFile(item.id))));
}

function toggleCourseArchive(id) {
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  course.archived = !course.archived;
  saveState(); renderAll();
  showToast(course.archived ? 'Kursen har arkiverats' : 'Kursen är aktiv igen');
}

function moveCourse(id, direction) {
  const course = state.courses.find((item) => item.id === id);
  if (!course) return;
  const peers = state.courses.filter((item) => Boolean(item.archived) === Boolean(course.archived));
  const peerIndex = peers.findIndex((item) => item.id === id);
  const targetPeer = peers[peerIndex + (direction === 'up' ? -1 : 1)];
  if (!targetPeer) return;
  const courseIndex = state.courses.indexOf(course);
  const targetIndex = state.courses.indexOf(targetPeer);
  [state.courses[courseIndex], state.courses[targetIndex]] = [state.courses[targetIndex], state.courses[courseIndex]];
  saveState();
  renderAll();
  showToast(`${course.name} har flyttats ${direction === 'up' ? 'uppåt' : 'nedåt'}`);
}

function deleteEvent(id) {
  const item = state.events.find((event) => event.id === id);
  if (!item || !confirm(`Ta bort “${item.name}”?`)) return;
  const index = state.events.indexOf(item);
  state.events.splice(index, 1);
  saveState(); renderAll();
  showUndoToast('Planeringen har tagits bort', () => {
    state.events.splice(Math.min(index, state.events.length), 0, item);
    saveState(); renderAll();
  });
}

function toggleEvent(id) {
  const item = state.events.find((event) => event.id === id);
  if (!item) return;
  item.completed = !item.completed;
  saveState(); renderAll();
  showToast(item.completed ? 'Markerad som klar' : 'Flyttad tillbaka till att göra');
}

function sidebarIsModal() { return matchMedia('(max-width: 820px)').matches; }

function syncSidebarAccessibility() {
  const hidden = sidebarIsModal() && !els.sidebar.classList.contains('open');
  els.sidebar.inert = hidden;
  els.menuButton.setAttribute('aria-expanded', String(sidebarIsModal() && !hidden));
  if (hidden) els.sidebar.setAttribute('aria-hidden', 'true');
  else els.sidebar.removeAttribute('aria-hidden');
}

function openSidebar() {
  els.sidebar.classList.add('open');
  els.sidebarBackdrop.classList.add('show');
  syncSidebarAccessibility();
  els.sidebar.querySelector('.nav-item.active')?.focus();
}

function closeSidebar({ restoreFocus = false } = {}) {
  const wasOpen = els.sidebar.classList.contains('open');
  els.sidebar.classList.remove('open');
  els.sidebarBackdrop.classList.remove('show');
  syncSidebarAccessibility();
  if (restoreFocus && wasOpen && sidebarIsModal()) els.menuButton.focus();
}

function handleViewportChange() {
  if (!sidebarIsModal()) {
    els.sidebar.classList.remove('open');
    els.sidebarBackdrop.classList.remove('show');
  }
  syncSidebarAccessibility();
}

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelectorAll('[data-go-to]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.goTo)));
['#quickAddButton', '#addResourceButton', '#addResourceOverview'].forEach((selector) => document.querySelector(selector)?.addEventListener('click', () => openDialog('resource')));
['#addCourseButton', '#addCourseOverview'].forEach((selector) => document.querySelector(selector)?.addEventListener('click', () => openDialog('course')));
['#addDateOverview', '#addDateCalendar'].forEach((selector) => document.querySelector(selector).addEventListener('click', () => openDialog('date')));
document.querySelector('#importCalendarOverview').addEventListener('click', () => {
  calendarImportCourseId = els.calendarImportTarget.value;
  els.calendarImportInput.click();
});
document.querySelector('#focusAddButton').addEventListener('click', () => openDialog(state.courses.some((course) => !course.archived) ? 'resource' : 'course'));
document.querySelector('#backToCourses').addEventListener('click', () => switchView('courses'));
els.menuButton.addEventListener('click', openSidebar);
els.sidebarBackdrop.addEventListener('click', () => closeSidebar({ restoreFocus: true }));
window.addEventListener('resize', handleViewportChange);
els.courseSearch.addEventListener('input', renderCourses);
els.resourceSearch.addEventListener('input', renderResources);
els.resourceType.addEventListener('change', updateResourceFields);
els.dateType.addEventListener('change', useDefaultDuration);
els.searchCourseButton.addEventListener('click', searchCourse);
els.courseCodeSearch.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); searchCourse(); } });
els.form.addEventListener('submit', handleSubmit);
document.querySelectorAll('.mode-option').forEach((button) => button.addEventListener('click', () => {
  editingCourseId = null;
  editingResourceId = null;
  editingEventId = null;
  els.dialogKicker.textContent = 'LÄGG TILL';
  setAddMode(button.dataset.addMode);
  if (button.dataset.addMode === 'date') {
    if (!els.dateValue.value) {
      const start = new Date();
      start.setSeconds(0, 0);
      start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30);
      els.dateValue.value = toLocalDateTimeValue(start);
    }
    useDefaultDuration();
  }
}));
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => els.dialog.close()));
document.querySelectorAll('[data-close-preview]').forEach((button) => button.addEventListener('click', closeResourcePreview));
els.previewDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeResourcePreview(); });
document.querySelectorAll('[data-close-event-preview]').forEach((button) => button.addEventListener('click', closeEventPreview));
els.eventPreviewDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeEventPreview(); });
els.eventPreviewEdit.addEventListener('click', () => {
  const id = previewedEventId;
  closeEventPreview();
  if (id) editEvent(id);
});
els.eventPreviewToggle.addEventListener('click', () => {
  const id = previewedEventId;
  if (!id) return;
  toggleEvent(id);
  showEventPreview(id);
});
document.querySelectorAll('#resourceFilters .filter-pill').forEach((button) => button.addEventListener('click', () => {
  currentResourceFilter = button.dataset.filter;
  document.querySelectorAll('#resourceFilters .filter-pill').forEach((pill) => pill.classList.toggle('active', pill === button));
  renderResources();
}));
document.querySelectorAll('[data-course-filter]').forEach((button) => button.addEventListener('click', () => {
  currentCourseFilter = button.dataset.courseFilter;
  document.querySelectorAll('[data-course-filter]').forEach((pill) => pill.classList.toggle('active', pill === button));
  renderCourses();
}));
document.querySelector('#calendarPreviousWeek').addEventListener('click', () => {
  calendarWeekStart = addDays(calendarWeekStart, -7);
  renderCalendar();
});
document.querySelector('#calendarToday').addEventListener('click', () => {
  calendarWeekStart = startOfWeek(new Date());
  renderCalendar();
});
document.querySelector('#calendarNextWeek').addEventListener('click', () => {
  calendarWeekStart = addDays(calendarWeekStart, 7);
  renderCalendar();
});

els.resourceFile.addEventListener('change', () => {
  const label = document.querySelector('.file-drop strong');
  label.textContent = els.resourceFile.files[0]?.name || 'Välj en fil från datorn';
});

els.globalSearch.addEventListener('input', () => {
  const query = els.globalSearch.value;
  els.resourceSearch.value = query;
  if (query.trim() && currentView !== 'resources') switchView('resources', { preserveFocus: true });
  renderResources();
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault(); els.globalSearch.focus();
  }
  if (event.key === 'Escape') closeSidebar({ restoreFocus: true });
});

document.addEventListener('click', (event) => {
  const courseTarget = event.target.closest('[data-course-id]');
  const openTarget = event.target.closest('[data-open-resource]');
  const deleteTarget = event.target.closest('[data-delete-resource]');
  const editResourceTarget = event.target.closest('[data-edit-resource]');
  const addTarget = event.target.closest('[data-add-resource-course]');
  const addDateTarget = event.target.closest('[data-add-date-course]');
  const importCalendarTarget = event.target.closest('[data-import-calendar-course]');
  const deleteCourseTarget = event.target.closest('[data-delete-course]');
  const editCourseTarget = event.target.closest('[data-edit-course]');
  const archiveCourseTarget = event.target.closest('[data-toggle-course-archive]');
  const moveCourseTarget = event.target.closest('[data-move-course]');
  const deleteEventTarget = event.target.closest('[data-delete-event]');
  const editEventTarget = event.target.closest('[data-edit-event]');
  const previewEventTarget = event.target.closest('[data-preview-event]');
  const toggleEventTarget = event.target.closest('[data-toggle-event]');
  const openEventCourseTarget = event.target.closest('[data-open-event-course]');
  const copyCourseCodeTarget = event.target.closest('[data-copy-course-code]');
  if (moveCourseTarget) moveCourse(moveCourseTarget.dataset.moveCourse, moveCourseTarget.dataset.moveDirection);
  else if (courseTarget) openCourse(courseTarget.dataset.courseId);
  else if (openTarget) openResource(openTarget.dataset.openResource);
  else if (editResourceTarget) editResource(editResourceTarget.dataset.editResource);
  else if (deleteTarget) deleteResource(deleteTarget.dataset.deleteResource);
  else if (addTarget) openDialog('resource', addTarget.dataset.addResourceCourse);
  else if (addDateTarget) openDialog('date', addDateTarget.dataset.addDateCourse);
  else if (importCalendarTarget) {
    calendarImportCourseId = importCalendarTarget.dataset.importCalendarCourse;
    els.calendarImportInput.click();
  }
  else if (deleteCourseTarget) deleteCourse(deleteCourseTarget.dataset.deleteCourse);
  else if (editCourseTarget) editCourse(editCourseTarget.dataset.editCourse);
  else if (archiveCourseTarget) toggleCourseArchive(archiveCourseTarget.dataset.toggleCourseArchive);
  else if (deleteEventTarget) deleteEvent(deleteEventTarget.dataset.deleteEvent);
  else if (editEventTarget) editEvent(editEventTarget.dataset.editEvent);
  else if (previewEventTarget) showEventPreview(previewEventTarget.dataset.previewEvent);
  else if (toggleEventTarget) toggleEvent(toggleEventTarget.dataset.toggleEvent);
  else if (openEventCourseTarget) { closeEventPreview(); openCourse(openEventCourseTarget.dataset.openEventCourse); }
  else if (copyCourseCodeTarget) copyCourseCode(copyCourseCodeTarget.dataset.copyCourseCode);
});

document.addEventListener('keydown', (event) => {
  const courseTarget = event.target.closest?.('.course-row[data-course-id]');
  if (courseTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openCourse(courseTarget.dataset.courseId); }
});

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('studieportalen-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeFile(id, file) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    transaction.objectStore('files').put(file, id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

async function getFile(id) {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const request = db.transaction('files', 'readonly').objectStore('files').get(id);
      request.onsuccess = () => { db.close(); resolve(request.result); };
      request.onerror = () => { db.close(); resolve(null); };
    });
  } catch (_) { return null; }
}

async function removeFile(id) {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').delete(id);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); resolve(); };
    });
  } catch (_) {}
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlAsBlob(dataUrl, preferredType = '') {
  const match = dataUrl.match(/^data:([^;,]{0,120})?;base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) throw new Error('En fil i säkerhetskopian har ogiltigt format.');
  let binary;
  try { binary = atob(match[2].replace(/[\r\n]/g, '')); }
  catch (_) { throw new Error('En fil i säkerhetskopian kunde inte avkodas.'); }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: preferredType || match[1] || 'application/octet-stream' });
}

async function replaceFiles(files, nextState) {
  const db = await openDb();
  const previous = structuredClone(lastSavedState);
  const previousRaw = localStorage.getItem(STORAGE_KEY);
  const previousReadFailed = storageReadFailed;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    const store = transaction.objectStore('files');
    store.clear();
    files.forEach(({ resourceId, file }) => store.put(file, resourceId));
    let saveError;
    // Save metadata while the file transaction can still be rolled back.
    store.count().onsuccess = () => {
      try { state = nextState; saveState({ allowRecovery: previousReadFailed }); }
      catch (error) { saveError = error; transaction.abort(); }
    };
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onabort = () => {
      db.close();
      state = previous;
      lastSavedState = structuredClone(previous);
      storageReadFailed = previousReadFailed;
      try {
        if (previousRaw === null) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, previousRaw);
      } catch (_) { /* The previous value remains when a quota write fails. */ }
      renderAll();
      reject(saveError || transaction.error || new Error('Återställningen avbröts. Tidigare filer finns kvar.'));
    };
  });
}

function cleanBackupText(value, maxLength) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function validBackupId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{1,160}$/.test(value);
}

function validateBackup(input) {
  if (!input || input.format !== BACKUP_FORMAT || input.version !== BACKUP_VERSION) throw new Error('Säkerhetskopian har ett format som inte stöds.');
  const data = input.appData;
  if (!data || !Array.isArray(data.courses) || !Array.isArray(data.resources) || !Array.isArray(data.events)) throw new Error('Säkerhetskopian saknar nödvändig profildata.');
  if (data.courses.length > 500 || data.resources.length > 5000 || data.events.length > 10000 || (input.files?.length || 0) > 1000) throw new Error('Säkerhetskopian innehåller orimligt många poster.');

  const ids = new Set();
  const courses = data.courses.map((course) => {
    if (!validBackupId(course.id) || ids.has(course.id) || typeof course.name !== 'string' || !course.name.trim()) throw new Error('En kurs i säkerhetskopian är ogiltig.');
    ids.add(course.id);
    return {
      id: course.id,
      name: cleanBackupText(course.name, 80).trim(),
      code: cleanBackupText(course.code, 16).trim().toUpperCase(),
      description: cleanBackupText(course.description, 2000).trim(),
      url: normalizeUrl(cleanBackupText(course.url, 2000).trim()),
      courseHomeUrl: normalizeUrl(cleanBackupText(course.courseHomeUrl, 2000).trim()),
      scheduleUrl: normalizeUrl(cleanBackupText(course.scheduleUrl, 2000).trim()),
      university: cleanBackupText(course.university, 30).trim(),
      universityName: cleanBackupText(course.universityName, 80).trim(),
      color: ['purple', 'blue', 'teal', 'amber', 'rose'].includes(course.color) ? course.color : 'purple',
      archived: Boolean(course.archived),
      createdAt: Number.isNaN(new Date(course.createdAt).getTime()) ? new Date().toISOString() : new Date(course.createdAt).toISOString(),
    };
  });
  const courseIds = new Set(courses.map((course) => course.id));
  const resourceIds = new Set();
  const resources = data.resources.map((resource) => {
    const courseId = cleanBackupText(resource.courseId, 160);
    if (!validBackupId(resource.id) || resourceIds.has(resource.id) || (courseId && !courseIds.has(courseId)) || !['exam', 'image', 'link', 'note', 'info'].includes(resource.type)) throw new Error('En resurs i säkerhetskopian är ogiltig.');
    resourceIds.add(resource.id);
    return {
      id: resource.id,
      name: cleanBackupText(resource.name, 120).trim() || 'Namnlös resurs',
      courseId,
      type: resource.type,
      url: normalizeUrl(cleanBackupText(resource.url, 2000).trim()),
      note: cleanBackupText(resource.note, 200000),
      fileName: cleanBackupText(resource.fileName, 255),
      createdAt: Number.isNaN(new Date(resource.createdAt).getTime()) ? new Date().toISOString() : new Date(resource.createdAt).toISOString(),
      sample: false,
    };
  });
  const eventIds = new Set();
  const events = data.events.map((item) => {
    const date = new Date(item.date);
    const candidateEnd = item.endDate ? new Date(item.endDate) : null;
    const courseId = cleanBackupText(item.courseId, 160);
    if (!validBackupId(item.id) || eventIds.has(item.id) || (courseId && !courseIds.has(courseId)) || Number.isNaN(date.getTime()) || !['deadline', 'exam', 'lecture', 'seminar', 'lesson', 'reading', 'lab'].includes(item.type)) throw new Error('En planeringspost i säkerhetskopian är ogiltig.');
    if (candidateEnd && (Number.isNaN(candidateEnd.getTime()) || candidateEnd <= date)) throw new Error('En sluttid i säkerhetskopian är ogiltig.');
    eventIds.add(item.id);
    return {
      id: item.id,
      type: item.type,
      name: cleanBackupText(item.name, 120).trim() || 'Namnlöst datum',
      courseId,
      date: date.toISOString(),
      endDate: candidateEnd?.toISOString() || '',
      note: cleanBackupText(item.note, 2000),
      completed: Boolean(item.completed),
      source: item.source === 'ical' ? 'ical' : '',
      sourceId: cleanBackupText(item.sourceId, 500),
      createdAt: Number.isNaN(new Date(item.createdAt).getTime()) ? new Date().toISOString() : new Date(item.createdAt).toISOString(),
    };
  });
  const fileIds = new Set();
  const files = (Array.isArray(input.files) ? input.files : []).map((entry) => {
    const largestDataUrl = Math.ceil(MAX_RESOURCE_FILE_BYTES * 4 / 3) + 300;
    if (!resourceIds.has(entry.resourceId) || fileIds.has(entry.resourceId) || typeof entry.dataUrl !== 'string' || !/^data:[^,]{0,200};base64,/.test(entry.dataUrl) || entry.dataUrl.length > largestDataUrl) throw new Error('En fil i säkerhetskopian är ogiltig eller för stor.');
    fileIds.add(entry.resourceId);
    return {
      resourceId: entry.resourceId,
      name: cleanBackupText(entry.name, 255) || 'fil',
      type: cleanBackupText(entry.type, 120),
      lastModified: Number.isFinite(entry.lastModified) ? entry.lastModified : Date.now(),
      dataUrl: entry.dataUrl,
    };
  });
  return { appData: { courses, resources, events }, files };
}

async function exportProfile() {
  els.exportButton.disabled = true;
  els.exportButton.textContent = 'Förbereder säkerhetskopia…';
  try {
    const files = [];
    let totalFileBytes = 0;
    for (const resource of state.resources) {
      if (!resource.fileName) continue;
      const file = await getFile(resource.id);
      if (!file) continue;
      if (file.size > MAX_RESOURCE_FILE_BYTES) throw new Error('En fil är större än 25 MB.');
      totalFileBytes += file.size;
      if (totalFileBytes > MAX_BACKUP_RAW_FILE_BYTES) throw new Error('Filerna är för stora för en säker säkerhetskopia.');
      files.push({ resourceId: resource.id, name: file.name || resource.fileName || 'fil', type: file.type || '', lastModified: file.lastModified || Date.now(), dataUrl: await fileAsDataUrl(file) });
    }
    const backup = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), appData: state, files };
    const backupBlob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    if (backupBlob.size > MAX_BACKUP_FILE_BYTES) throw new Error('Säkerhetskopian blir större än 100 MB.');
    const blobUrl = URL.createObjectURL(backupBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `studieportalen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    showToast(`Säkerhetskopian är klar · ${files.length} filer`);
  } catch (error) {
    alert(error.message || 'Säkerhetskopian kunde inte skapas. Din befintliga data har inte ändrats.');
  } finally {
    els.exportButton.disabled = false;
    els.exportButton.innerHTML = `${svg('download')} Exportera säkerhetskopia`;
  }
}

async function importProfile(event) {
  const backupFile = event.target.files[0];
  event.target.value = '';
  if (!backupFile) return;
  if (backupFile.size > MAX_BACKUP_FILE_BYTES) return alert('Säkerhetskopian är för stor. Maximal storlek är 100 MB.');
  try {
    const parsed = validateBackup(JSON.parse(await backupFile.text()));
    const confirmed = confirm(`Återställ ${parsed.appData.courses.length} kurser, ${parsed.appData.resources.length} resurser och ${parsed.appData.events.length} datum? Nuvarande profil ersätts.`);
    if (!confirmed) return;
    els.importButton.disabled = true;
    const restoredFiles = [];
    for (const entry of parsed.files) {
      const blob = dataUrlAsBlob(entry.dataUrl, entry.type);
      if (blob.size > MAX_RESOURCE_FILE_BYTES) throw new Error('En fil i säkerhetskopian är större än 25 MB.');
      restoredFiles.push({ resourceId: entry.resourceId, file: new File([blob], entry.name, { type: entry.type || blob.type, lastModified: entry.lastModified }) });
    }
    await settlePendingUndo();
    await replaceFiles(restoredFiles, parsed.appData);
    selectedCourseId = null;
    renderAll();
    switchView('overview');
    showToast(`Profilen återställd · ${restoredFiles.length} filer`);
  } catch (error) {
    alert(error.message || 'Säkerhetskopian kunde inte läsas. Din befintliga data har inte ändrats.');
  } finally {
    els.importButton.disabled = false;
  }
}

async function importCalendar(event) {
  const calendarFile = event.target.files[0];
  event.target.value = '';
  const courseId = calendarImportCourseId;
  calendarImportCourseId = null;
  if (!calendarFile || courseId === null) return;
  const course = courseId ? state.courses.find((item) => item.id === courseId) : null;
  if (courseId && !course) return alert('Kursen kunde inte hittas. Ingen kalender importerades.');
  if (calendarFile.size > 2_000_000) return alert('Kalenderfilen är för stor. Maximal storlek är 2 MB.');
  try {
    const imported = window.StudieportalenCalendar?.parseCalendar(await calendarFile.text()) || [];
    if (!imported.length) return alert('Inga giltiga kalenderhändelser hittades i filen.');
    const unique = imported.filter((item, index, items) => items.findIndex((candidate) => candidate.sourceId === item.sourceId) === index);
    const additions = unique.filter((item) => !state.events.some((existing) => (
      existing.courseId === courseId
      && ((existing.source === 'ical' && existing.sourceId === item.sourceId)
        || (existing.date === item.date && existing.name.toLocaleLowerCase('sv') === item.name.toLocaleLowerCase('sv')))
    )));
    const duplicateCount = unique.length - additions.length;
    if (!additions.length) return showToast(`Kalendern är redan importerad · ${duplicateCount} dubbletter`);
    const chosen = await previewCalendar(additions, course?.name || 'Allmänt', duplicateCount);
    if (!chosen.length || (courseId && !state.courses.some((item) => item.id === courseId))) return;
    const createdAt = new Date().toISOString();
    chosen.forEach((item) => state.events.push({
      id: uid('event'),
      courseId,
      name: item.name,
      date: item.date,
      endDate: item.endDate || '',
      type: item.type,
      note: item.note,
      completed: false,
      source: 'ical',
      sourceId: item.sourceId,
      createdAt,
    }));
    saveState();
    renderAll();
    showToast(`${chosen.length} kalenderhändelser importerades`);
  } catch (error) {
    alert(error.message || 'Kalenderfilen kunde inte läsas.');
  }
}

function eventTypeLabel(type) {
  return { deadline: 'Deadline', exam: 'Tentamen', lecture: 'Föreläsning', seminar: 'Seminarium', lab: 'Laboration', lesson: 'Lektion eller uppgift', reading: 'Läsning' }[type] || 'Schemapass';
}

function previewCalendar(items, courseName, duplicateCount) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal calendar-preview';
    dialog.setAttribute('aria-labelledby', 'calendarPreviewTitle');
    dialog.innerHTML = `<form method="dialog"><div class="modal-head"><h2 id="calendarPreviewTitle">Välj kalenderhändelser</h2></div>
      <p>${escapeHtml(courseName)} · ${items.length} nya händelser</p>
      <p>Kontrollera kurs, datum och typ. Importen är en ögonblicksbild och uppdateras inte automatiskt.</p>
      ${duplicateCount ? `<p>${duplicateCount} dubbletter hoppas över.</p>` : ''}
      <div class="calendar-choices">${items.map((item, index) => `<label><input type="checkbox" name="event" value="${index}" checked><span><strong>${escapeHtml(item.name)}</strong><br>${escapeHtml(new Date(item.date).toLocaleString('sv-SE'))}${item.endDate ? `–${escapeHtml(formatTime(new Date(item.endDate)))}` : ''} · ${escapeHtml(eventTypeLabel(item.type))}</span></label>`).join('')}</div>
      <div class="modal-actions"><button class="secondary-button" value="cancel">Avbryt</button><button class="primary-button" value="import">Importera valda</button></div></form>`;
    dialog.addEventListener('close', () => {
      const selected = dialog.returnValue === 'import' ? [...dialog.querySelectorAll('input:checked')].map((input) => items[Number(input.value)]) : [];
      dialog.remove(); resolve(selected);
    }, { once: true });
    document.body.append(dialog); dialog.showModal();
  });
}

const now = new Date();
document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).format(now).toUpperCase();
document.querySelector('#greeting').textContent = now.getHours() < 10 ? 'God morgon' : now.getHours() < 17 ? 'God eftermiddag' : 'God kväll';

const initialHash = location.hash.replace('#', '');
if (['overview', 'courses', 'resources', 'calendar'].includes(initialHash)) switchView(initialHash, { updateHash: false });
renderAll();

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector('#installButton').classList.remove('hidden');
});

document.querySelector('#installButton').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.querySelector('#installButton').classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  document.querySelector('#installButton').classList.add('hidden');
  showToast('Studieportalen är installerad');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const tools = [
    {
      name: 'list_courses', title: 'Lista kurser', description: 'Visar användarens lokalt sparade kurser.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => ({ courses: state.courses.map(({ id, name, code, universityName }) => ({ id, name, code, universityName })) }),
    },
    {
      name: 'add_deadline', title: 'Lägg till deadline', description: 'Lägger till en deadline eller tentamen för en befintlig kurs.',
      inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, name: { type: 'string' }, date: { type: 'string' }, type: { type: 'string', enum: ['deadline', 'exam'] } }, required: ['courseId', 'name', 'date', 'type'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        if (!state.courses.some((course) => course.id === input.courseId)) throw new Error('Kursen finns inte.');
        const parsedDate = new Date(input.date);
        if (!input.name?.trim() || Number.isNaN(parsedDate.getTime())) throw new Error('Namn eller datum är ogiltigt.');
        const item = { id: uid('event'), courseId: input.courseId, name: input.name.trim(), date: parsedDate.toISOString(), type: input.type, note: '', completed: false, createdAt: new Date().toISOString() };
        state.events.push(item); saveState(); renderAll();
        return { id: item.id, status: 'saved' };
      },
    },
  ];
  tools.forEach((tool) => { try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch (_) {} });
}

registerWebMcpTools();

handleViewportChange();

els.exportButton.addEventListener('click', exportProfile);
els.importButton.addEventListener('click', () => els.importInput.click());
els.importInput.addEventListener('change', importProfile);
els.calendarImportInput.addEventListener('change', importCalendar);
