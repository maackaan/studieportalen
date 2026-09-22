(function exposeCalendarParser(root, factory) {
  const parser = factory();
  if (typeof module === 'object' && module.exports) module.exports = parser;
  else root.StudieportalenCalendar = parser;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function unescapeText(value = '') {
    return value
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
      .trim();
  }

  function parseDate(value = '', timeZone = '') {
    const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
    if (!match) return null;
    const [, year, month, day, hour = '09', minute = '00', second = '00', utc] = match;
    const parts = [year, month, day, hour, minute, second].map(Number);
    const stamp = Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
    const check = new Date(stamp);
    if (check.getUTCFullYear() !== parts[0] || check.getUTCMonth() !== parts[1] - 1 || check.getUTCDate() !== parts[2]
      || parts[3] > 23 || parts[4] > 59 || parts[5] > 59) return null;
    if (timeZone && !utc && value.includes('T')) {
      try {
        const formatter = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
        const wallTime = (instant) => {
          const p = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(({type, value}) => [type, value]));
          return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
        };
        let instant = stamp;
        for (let attempt = 0; attempt < 3; attempt++) instant += stamp - wallTime(instant);
        return wallTime(instant) === stamp ? new Date(instant) : null;
      } catch (_) { return null; }
    }
    const date = utc
      ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]))
      : new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function eventType(summary, description) {
    const text = summary;
    if (/(?:^|\W)(?:tentamen|tenta|exam|examination)(?:$|\W)/i.test(text)) return 'exam';
    if (/(?:^|\W)(?:laboration|laborationer|lab)(?:$|\W)/i.test(text)) return 'lab';
    if (/(?:^|\W)(?:föreläsning|föreläsningar|lecture)(?:$|\W)/i.test(text)) return 'lecture';
    if (/(?:^|\W)(?:seminarium|seminarier|seminar)(?:$|\W)/i.test(text)) return 'seminar';
    return 'lesson';
  }

  function parseCalendar(text) {
    if (typeof text !== 'string') return [];
    const unfolded = text.replace(/\r?\n[ \t]/g, '');
    const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) || [];
    if (blocks.length > 2000) throw new Error('Kalendern innehåller för många händelser. Välj en kortare period.');
    return blocks.flatMap((block) => {
      const values = {};
      const timeZones = {};
      block.split(/\r?\n/).forEach((line) => {
        const colon = line.indexOf(':');
        if (colon < 0) return;
        const key = line.slice(0, colon).split(';', 1)[0].toUpperCase();
        if (key === 'DTSTART' || key === 'DTEND') timeZones[key] = line.slice(0, colon).match(/TZID="?([^;"\r\n]+)/i)?.[1] || '';
        if (!values[key]) values[key] = line.slice(colon + 1);
      });
      if (values.STATUS === 'CANCELLED') return [];
      if (values.RRULE || values.RDATE || values.EXDATE) throw new Error('Återkommande kalenderregler stöds inte ännu. Exportera en kalender med separata tillfällen.');
      const date = parseDate(values.DTSTART, timeZones.DTSTART);
      if (!date) throw new Error('Ett datum eller en tidszon kunde inte tolkas. Ingen händelse importerades.');
      const endDate = values.DTEND ? parseDate(values.DTEND, timeZones.DTEND || timeZones.DTSTART) : null;
      if (values.DTEND && (!endDate || endDate <= date)) throw new Error('En sluttid i kalendern kunde inte tolkas. Ingen händelse importerades.');
      const name = unescapeText(values.SUMMARY || 'Schemahändelse').slice(0, 120) || 'Schemahändelse';
      const description = unescapeText(values.DESCRIPTION || '');
      const location = unescapeText(values.LOCATION || '');
      const note = [location ? `Plats: ${location}` : '', description].filter(Boolean).join('\n').slice(0, 2000);
      const sourceId = unescapeText(values.UID ? `${values.UID}${values['RECURRENCE-ID'] ? `|${values['RECURRENCE-ID']}` : ''}` : `${values.DTSTART || ''}|${name}`).slice(0, 500);
      return [{ sourceId, name, date: date.toISOString(), endDate: endDate?.toISOString() || '', type: eventType(name, description), note }];
    });
  }

  return { parseCalendar, parseDate, eventType };
}));
