// Optional listing assets. Fictional examples in a disposable browser profile.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:900}, timezoneId:'Europe/Stockholm'});
    const page = await context.newPage();
    const output = 'build/store-listing';
    await fs.mkdir(output, {recursive:true});
    await page.clock.install({time:new Date('2026-10-12T09:30:00+02:00')});
    await page.goto(process.env.APP_URL || 'http://localhost:4173');
    await page.evaluate(() => {
      const createdAt = '2026-10-12T08:00:00+02:00';
      state = {
        courses:[
          {id:'demo-programming', name:'Programmering', code:'DEMO01', color:'purple', credits:'7,5 hp', university:'other', universityName:'Exempeluniversitet', createdAt},
          {id:'demo-math', name:'Linjär algebra', code:'DEMO02', color:'blue', credits:'6 hp', university:'other', universityName:'Exempeluniversitet', createdAt},
          {id:'demo-networks', name:'Mobila nätverk', code:'DEMO03', color:'teal', credits:'6 hp', university:'other', universityName:'Exempeluniversitet', createdAt},
        ],
        resources:[
          {id:'demo-info', courseId:'demo-programming', type:'info', name:'Labbkompendium', note:'Exempelmaterial: instruktioner, förberedelser och checklistor för laborationerna.', createdAt},
          {id:'demo-note', courseId:'demo-math', type:'note', name:'Repetition inför tentan', note:'Exempelanteckning: matriser, vektorer och linjära ekvationssystem.', createdAt},
        ],
        events:[
          {id:'demo-lecture', name:'Föreläsning', courseId:'demo-programming', type:'lecture', date:'2026-10-12T10:00:00+02:00', endDate:'2026-10-12T12:00:00+02:00', createdAt},
          {id:'demo-lab', name:'Laboration 2', courseId:'demo-programming', type:'lab', date:'2026-10-13T13:00:00+02:00', endDate:'2026-10-13T15:00:00+02:00', note:'Förbered uppgifterna och ta med datorn.', createdAt},
          {id:'demo-exam', name:'Kontrollskrivning', courseId:'demo-math', type:'exam', date:'2026-10-14T08:00:00+02:00', endDate:'2026-10-14T12:00:00+02:00', createdAt},
          {id:'demo-seminar', name:'Slutseminarium', courseId:'demo-networks', type:'reading', date:'2026-10-15T10:15:00+02:00', endDate:'2026-10-15T12:15:00+02:00', createdAt},
          {id:'demo-general', name:'Studiegrupp', courseId:'', type:'lesson', date:'2026-10-16T13:00:00+02:00', endDate:'2026-10-16T15:00:00+02:00', createdAt},
        ],
      };
      saveState(); renderAll(); switchView('overview');
    });
    assert.equal(await page.locator('#courseCount').textContent(),'3');
    await page.screenshot({path:`${output}/01-overview.png`,animations:'disabled'});
    await page.locator('[data-view="calendar"]').click();
    assert.equal(await page.locator('.calendar-day-heading').count(),7);
    await page.screenshot({path:`${output}/02-week-calendar.png`,animations:'disabled'});
    await page.locator('#calendarWeek [data-preview-event="demo-lab"]').click();
    await page.screenshot({path:`${output}/03-event-info.png`,animations:'disabled'});
    await page.locator('[data-close-event-preview]').click();
    await page.evaluate(() => openCourse('demo-programming'));
    await page.screenshot({path:`${output}/04-course.png`,animations:'disabled'});
    console.log(`Store-skärmbilder med exempeldata: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
