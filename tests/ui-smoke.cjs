// Run with Playwright installed, against an already running development server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const key = 'studieportalen-data-v2';
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? {channel: process.env.BROWSER_CHANNEL} : {}) });
  try {
    const context = await browser.newContext({viewport: {width:1280,height:820}, acceptDownloads:true});
    const page = await context.newPage();
    const errors = [];
    const dialogs = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => { dialogs.push(dialog.message()); dialog.accept(); });
    const firstResponse = await page.goto(process.env.APP_URL || 'http://localhost:4173');
    assert.match((await firstResponse.allHeaders())['content-security-policy'],/object-src 'none'/);
    assert.equal(await page.locator('#courseCount').textContent(), '0');
    assert.equal(await page.locator('.app-version').textContent(), 'Version 0.1.0-beta.3-dev');
    await page.evaluate(() => {
      state.courses = Array.from({length: 5}, (_, index) => ({
        id: `overview-${index + 1}`,
        name: `Översiktskurs ${index + 1}`,
        code: `OV${index + 1}`,
        color: 'purple',
        archived: false,
        createdAt: new Date(2026, 8, index + 1).toISOString(),
      }));
      saveState();
      renderAll();
    });
    assert.equal(await page.locator('#overviewCourseList [data-course-id]').count(), 5);
    await page.evaluate(() => switchView('courses'));
    await page.locator('[data-move-course="overview-1"][data-move-direction="down"]').click();
    assert.deepEqual(await page.evaluate(() => state.courses.map(course => course.id)), ['overview-2','overview-1','overview-3','overview-4','overview-5']);
    await page.evaluate(() => switchView('overview'));
    assert.equal(await page.locator('#overviewCourseList [data-course-id]').first().getAttribute('data-course-id'), 'overview-2');
    await page.evaluate(() => {
      state.courses = [];
      saveState();
      renderAll();
    });
    await page.locator('#quickAddButton').click();
    await page.locator('#resourceType').selectOption('info');
    assert.equal(await page.locator('#resourceCourse').inputValue(), '');
    await page.locator('#resourceName').fill('Labbkompendium');
    await page.locator('#resourceNote').fill('Allmän information som inte tillhör en viss kurs.');
    await page.locator('#resourceFile').setInputFiles({name:'labbkompendium.txt',mimeType:'text/plain',buffer:Buffer.from('allmänt kompendium')});
    await page.locator('#addForm button[type=submit]').click();
    await page.waitForFunction(() => state.resources.length === 1, null, {timeout: 5000}).catch(async error => {
      const details = await page.evaluate(() => ({formError: document.querySelector('#formError').textContent, dialogOpen: document.querySelector('#addDialog').open, stored: localStorage.getItem('studieportalen-data-v2')}));
      throw new Error(`Den allmänna informationsresursen sparades inte: ${JSON.stringify(details)} (${error.message})`);
    });
    assert.equal(await page.evaluate(() => state.resources[0].courseId), '');
    assert.equal(await page.evaluate(() => state.resources[0].type), 'info');
    await page.locator('#addDateOverview').click();
    assert.equal(await page.locator('#dateCourse').inputValue(), '');
    await page.locator('#dateName').fill('Allmän studiedag');
    await page.locator('#dateValue').fill('2026-12-15T10:00');
    await page.locator('#addForm button[type=submit]').click();
    assert.equal(await page.evaluate(() => state.events[0].courseId), '');
    assert.match(await page.locator('#upcomingDateList').textContent(), /Allmänt/);
    await page.locator('[data-view="calendar"]').click();
    assert.match(await page.locator('#calendarList').textContent(), /Allmän studiedag/);
    assert.equal(await page.locator('#calendarResultCount').textContent(), '1 post');
    await page.locator('[data-view="overview"]').click();
    await page.locator('#addCourseOverview').click();
    await page.locator('#universitySelect').selectOption('other');
    await page.locator('#courseName').fill('Testkurs med ett långt namn för layoutkontroll');
    await page.locator('#courseCode').fill('TEST01');
    await page.locator('#addForm button[type=submit]').click();
    await page.locator('#courseGrid [data-course-id]').click();
    assert.equal(await page.locator('[data-add-resource-course] svg').evaluate(el => getComputedStyle(el).fill),'none');
    await page.locator('[data-edit-course]').click();
    await page.locator('#courseDescription').fill('Uppdaterad lokal kursbeskrivning');
    await page.locator('#addForm button[type=submit]').click();
    assert.equal(await page.evaluate(() => state.courses[0].description),'Uppdaterad lokal kursbeskrivning');
    await page.locator('[data-toggle-course-archive]').click();
    assert.equal(await page.evaluate(() => state.courses[0].archived),true);
    await page.locator('[data-toggle-course-archive]').click();
    assert.equal(await page.evaluate(() => state.courses[0].archived),false);
    await page.locator('[data-add-resource-course]').click();
    await page.locator('#resourceType').selectOption('note');
    await page.locator('#resourceName').fill('Privat anteckning');
    await page.locator('#resourceNote').fill('Min lokala text <script>alert(1)</script>');
    assert.equal(await page.locator('#resourceNote').inputValue(),'Min lokala text <script>alert(1)</script>');
    await page.locator('#addForm button[type=submit]').click();
    await page.waitForFunction(() => state.resources.length === 2, null, {timeout: 5000}).catch(async error => {
      const details = await page.evaluate(() => ({addMode, formError: document.querySelector('#formError').textContent, stored: localStorage.getItem('studieportalen-data-v2')}));
      throw new Error(`Anteckningen sparades inte: ${JSON.stringify(details)} (${error.message})`);
    });
    await page.locator('#courseDetail [data-edit-resource]').click();
    await page.locator('#resourceNote').fill('Uppdaterad lokal anteckning');
    await page.locator('#addForm button[type=submit]').click();
    await page.locator('#courseDetail [data-open-resource]').click();
    assert.match(await page.locator('#previewBody').textContent(), /Uppdaterad lokal anteckning/);
    await page.locator('[data-close-preview]').click();
    await page.locator('[data-add-resource-course]').click();
    await page.locator('#resourceType').selectOption('exam');
    await page.locator('#resourceName').fill('För stor fil');
    await page.evaluate(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(25 * 1024 * 1024 + 1)],'stor.pdf',{type:'application/pdf'}));
      document.querySelector('#resourceFile').files = transfer.files;
    });
    await page.locator('#addForm button[type=submit]').click();
    assert.match(await page.locator('#formError').textContent(),/25 MB/);
    await page.getByRole('button',{name:'Avbryt',exact:true}).click();
    await page.locator('[data-add-resource-course]').click();
    await page.locator('#resourceType').selectOption('exam');
    await page.locator('#resourceName').fill('Testfil');
    await page.locator('#resourceFile').setInputFiles({name:'test.txt',mimeType:'text/plain',buffer:Buffer.from('lokalt filinnehåll')});
    await page.locator('#addForm button[type=submit]').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('studieportalen-data-v2')).resources.length === 3);
    const calendar = Buffer.from('BEGIN:VCALENDAR\r\n' + Array.from({length:8}, (_,i) => `BEGIN:VEVENT\r\nUID:test${i}\r\nDTSTART;TZID=Europe/Stockholm:202610${String(i+10).padStart(2,'0')}T090000\r\nSUMMARY:Tentamen ${i+1}\r\nEND:VEVENT\r\n`).join('') + 'END:VCALENDAR');
    async function importCalendar() {
      await page.locator('[data-import-calendar-course]').click();
      await page.locator('#calendarImportInput').setInputFiles({name:'schema.ics',mimeType:'text/calendar',buffer:calendar});
    }
    await importCalendar();
    await page.locator('.calendar-choices input').first().waitFor();
    assert.equal(await page.locator('.calendar-choices input').count(),8);
    await page.locator('.calendar-choices input').last().uncheck();
    await page.getByRole('button',{name:'Importera valda',exact:true}).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('studieportalen-data-v2')).events.length === 8);
    await importCalendar();
    await page.locator('.calendar-choices input').first().waitFor();
    assert.equal(await page.locator('.calendar-choices input').count(),1);
    await page.getByRole('button',{name:'Importera valda',exact:true}).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('studieportalen-data-v2')).events.length === 9);
    const generalCalendar = Buffer.from('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:allmant-schema\r\nDTSTART;TZID=Europe/Stockholm:20261120T130000\r\nSUMMARY:Allmänt schemapass\r\nEND:VEVENT\r\nEND:VCALENDAR');
    await page.locator('[data-view="calendar"]').click();
    await page.locator('#calendarImportTarget').selectOption('');
    await page.locator('#importCalendarOverview').click();
    await page.locator('#calendarImportInput').setInputFiles({name:'allmant.ics',mimeType:'text/calendar',buffer:generalCalendar});
    await page.locator('.calendar-choices input').first().waitFor();
    await page.getByRole('button',{name:'Importera valda',exact:true}).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('studieportalen-data-v2')).events.length === 10);
    assert.equal(await page.evaluate(() => state.events.find(event => event.name === 'Allmänt schemapass').courseId), '');
    await page.evaluate(() => openCourse(state.courses[0].id));
    await page.locator('#courseDetail [data-toggle-event]').first().click();
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).events.filter(x=>x.completed).length,key),1);
    await page.locator('#courseDetail [data-delete-event]').first().click();
    assert.equal(await page.evaluate(() => state.events.length),9);
    await page.getByRole('button',{name:'Ångra',exact:true}).click();
    assert.equal(await page.evaluate(() => state.events.length),10);
    await page.locator('[data-delete-course]').click();
    assert.equal(await page.evaluate(() => state.courses.length),0);
    await page.getByRole('button',{name:'Ångra',exact:true}).click();
    assert.equal(await page.evaluate(() => state.courses.length),1);
    assert.equal(await page.evaluate(async () => (await getFile(state.resources.find(x=>x.name === 'Testfil').id)).text()),'lokalt filinnehåll');
    await page.evaluate(() => openCourse(state.courses[0].id));
    await fs.mkdir('build',{recursive:true});
    for (const width of [1280,768,360]) {
      await page.setViewportSize({width,height:820});
      await page.evaluate(() => scrollTo({top:0,left:0,behavior:'instant'}));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`Page overflows at ${width}px`);
      const coursePanelGap = await page.locator('.course-detail-main > .panel').evaluateAll((panels) => panels[1].getBoundingClientRect().top - panels[0].getBoundingClientRect().bottom);
      assert.ok(coursePanelGap >= 28, `Course panels are only ${coursePanelGap}px apart at ${width}px`);
      if (width === 360) {
        await page.waitForFunction(() => document.querySelector('#sidebar').inert);
        assert.equal(await page.locator('#sidebar').evaluate(element => element.inert),true);
        await page.locator('#menuButton').click();
        assert.equal(await page.locator('#menuButton').getAttribute('aria-expanded'),'true');
        assert.equal(await page.locator('#sidebar').evaluate(element => element.inert),false);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#sidebar').evaluate(element => element.inert),true);
        assert.equal(await page.evaluate(() => document.activeElement.id),'menuButton');
      }
      await page.screenshot({path:`build/ui-${width}.png`,fullPage:true,animations:'disabled'});
    }
    await page.evaluate(() => switchView('calendar'));
    for (const width of [1280,768,360]) {
      await page.setViewportSize({width,height:820});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),`Calendar overflows at ${width}px`);
      assert.ok(await page.locator('#calendarList').isVisible(),`Calendar list is hidden at ${width}px`);
      await page.screenshot({path:`build/ui-calendar-${width}.png`,fullPage:true,animations:'disabled'});
    }
    await page.setViewportSize({width:1280,height:820});
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportButton').click();
    const download = await downloadPromise;
    const backup = await fs.readFile(await download.path());
    assert.equal(JSON.parse(backup).files.length,2);
    await page.reload();
    assert.equal(await page.locator('#courseCount').textContent(),'1');
    await page.evaluate(() => deleteResource(state.resources.find(x=>x.name === 'Testfil').id));
    await page.locator('#importInput').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
    await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('Profilen återställd'), null, {timeout:5000}).catch(() => {
      throw new Error(`Återställningen misslyckades: ${dialogs.at(-1) || 'inget felmeddelande'}`);
    });
    const data = await page.evaluate(key => JSON.parse(localStorage.getItem(key)),key);
    assert.equal(data.resources.length,3);
    assert.equal(data.events.length,10);
    assert.equal(data.resources.find(resource => resource.name === 'Labbkompendium').courseId,'');
    assert.equal(data.events.find(event => event.name === 'Allmän studiedag').courseId,'');
    assert.equal(await page.evaluate(async () => (await getFile(state.resources.find(x=>x.name === 'Testfil').id)).text()),'lokalt filinnehåll');
    await page.evaluate(async () => {
      const id = state.resources.find(x=>x.name === 'Testfil').id;
      await storeFile(id,new File(['<script>parent.document.title="COMPROMISED"</script>'],'test.html',{type:'text/html'}));
      await openResource(id);
    });
    assert.equal(await page.locator('#previewBody iframe').getAttribute('sandbox'),'');
    assert.equal(await page.title(),'Studieportalen');
    await page.locator('[data-close-preview]').click();
    await page.evaluate(async () => { await storeFile(state.resources.find(x=>x.name === 'Testfil').id,new File(['lokalt filinnehåll'],'test.txt',{type:'text/plain'})); });
    // Simulate exhausted metadata storage while restoring: old files must survive.
    await page.evaluate(() => { Storage.prototype.setItem = function(){throw new DOMException('Full','QuotaExceededError');}; });
    const altered = JSON.parse(backup); altered.files[0].dataUrl = 'data:text/plain;base64,Y2hhbmdlZA==';
    await page.locator('#importInput').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(altered))});
    await page.waitForFunction(() => !document.querySelector('#importButton').disabled);
    assert.equal(await page.evaluate(async () => (await getFile(state.resources.find(x=>x.name === 'Testfil').id)).text()),'lokalt filinnehåll');
    // Damaged metadata is preserved and can be repaired with a valid backup.
    await page.reload();
    await page.evaluate(key => localStorage.setItem(key,'{skadad profil'),key);
    await page.reload();
    assert.equal(await page.evaluate(key => localStorage.getItem(key),key),'{skadad profil');
    assert.equal(await page.locator('#courseCount').textContent(),'0');
    await page.locator('#importInput').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
    await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('Profilen återställd'));
    assert.equal(await page.locator('#courseCount').textContent(),'1');
    assert.equal(await page.evaluate(() => storageReadFailed),false);
    await page.evaluate(() => navigator.serviceWorker.ready);
    if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
    await context.setOffline(true);
    await page.reload();
    assert.equal(await page.locator('#courseCount').textContent(),'1');
    await context.setOffline(false);
    assert.deepEqual(errors,[]);
    console.log('UI smoke passed: data, calendar, UI, backup recovery and offline restart.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
