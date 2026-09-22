const assert = require('node:assert/strict');
const test = require('node:test');

const { eventType, parseCalendar, parseDate } = require('../dist/calendar-import.js');

test('parses TimeEdit-style calendar events and unfolds lines', () => {
  const events = parseCalendar([
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:tddd27-exam-1',
    'DTSTART:20261020T121500Z',
    'DTEND:20261020T161500Z',
    'SUMMARY:Tentamen TDDD27',
    'LOCATION:TER2',
    'DESCRIPTION:Anmälan krävs\\nTa med legitimation',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:tddd27-lab-1',
    'DTSTART;TZID=Europe/Stockholm:20260918T081500',
    'SUMMARY:Laboration 1',
    'DESCRIPTION:Fortsättning på nästa ',
    ' rad',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n'));

  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'exam');
  assert.equal(events[0].endDate, '2026-10-20T16:15:00.000Z');
  assert.match(events[0].note, /Plats: TER2/);
  assert.match(events[0].note, /Ta med legitimation/);
  assert.equal(events[1].type, 'lab');
  assert.match(events[1].note, /nästa rad/);
});

test('uses local morning for all-day values and ignores malformed dates', () => {
  const date = parseDate('20261103');
  assert.equal(date.getHours(), 9);
  assert.equal(parseDate('inte-ett-datum'), null);
});

test('does not classify ordinary teaching as an exam', () => {
  assert.equal(eventType('Föreläsning', 'Introduktion'), 'lecture');
  assert.equal(eventType('Seminarium', ''), 'seminar');
  assert.equal(eventType('Digital examination', ''), 'exam');
  assert.equal(eventType('Föreläsning', 'Förberedelse för tentamen'), 'lecture');
});

test('rejects impossible dates and converts Stockholm time regardless of computer timezone', () => {
  assert.equal(parseDate('20260230'), null);
  assert.equal(parseDate('20261301'), null);
  assert.equal(parseDate('20260918T251500'), null);
  assert.equal(parseDate('20260918T081500', 'Europe/Stockholm').toISOString(), '2026-09-18T06:15:00.000Z');
  assert.equal(parseDate('20261218T081500', 'Europe/Stockholm').toISOString(), '2026-12-18T07:15:00.000Z');
  assert.equal(parseDate('20260329T023000', 'Europe/Stockholm'), null);
});

test('uses the event time zone for end times and rejects an invalid range', () => {
  const [event] = parseCalendar('BEGIN:VEVENT\nDTSTART;TZID=Europe/Stockholm:20261218T081500\nDTEND;TZID=Europe/Stockholm:20261218T100000\nSUMMARY:Föreläsning\nEND:VEVENT');
  assert.equal(event.date, '2026-12-18T07:15:00.000Z');
  assert.equal(event.endDate, '2026-12-18T09:00:00.000Z');
  assert.throws(() => parseCalendar('BEGIN:VEVENT\nDTSTART:20260918T101500Z\nDTEND:20260918T091500Z\nEND:VEVENT'), /sluttid/);
});

test('skips cancelled events and rejects recurrence rather than silently losing occurrences', () => {
  assert.deepEqual(parseCalendar('BEGIN:VEVENT\nDTSTART:20260918T081500Z\nSTATUS:CANCELLED\nEND:VEVENT'), []);
  assert.throws(() => parseCalendar('BEGIN:VEVENT\nDTSTART:20260918T081500Z\nRRULE:FREQ=WEEKLY\nEND:VEVENT'), /Återkommande/);
});
