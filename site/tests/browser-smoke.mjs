import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const output = process.env.TEST_OUTPUT_DIR || '/workspace/scratch/consulting-preview';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  for (const [width, height] of [[1440,900],[1920,1080],[390,844],[320,640]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(response.status(),200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(),1);
    assert.ok(await page.locator('h1').textContent().then(t=>t.includes('Маркетинговый консалтинг')));
    const overflow = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    assert.ok(overflow.width <= width + 1, JSON.stringify(overflow));
    assert.equal(await page.locator('html').getAttribute('lang'),'ru');
    assert.equal(await page.locator('#services .service-row').count(),6);
    assert.equal(await page.locator('a[href="https://t.me/alexxstudio"]').count() >= 2,true);
    assert.equal(await page.locator('a[href="tel:+375255331012"]').count(),2);
    const font = await page.evaluate(() => ({ status: document.fonts.status, loaded: document.fonts.check('500 20px "manrope"'), family:getComputedStyle(document.body).fontFamily }));
    assert.equal(font.status,'loaded'); assert.ok(font.family.includes('manrope'));
    if (width < 800) {
      await page.getByRole('button',{name:'Меню'}).click();
      assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
      await page.getByRole('button',{name:'Меню'}).click();
      await page.locator('#main-navigation a[href="#services"]').click();
      assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
    }
    await page.locator('.situation .text-link').first().click();
    assert.equal(await page.locator('#message').inputValue(),'Систематизировать маркетинг');
    await page.locator('.service-row .text-link').nth(1).click();
    assert.equal(await page.locator('#message').inputValue(),'Аудит маркетинга');
    const faq = page.locator('.faq-list details').first();
    await faq.locator('summary').click(); assert.equal(await faq.getAttribute('open'),'');
    const structured = await page.locator('script[type="application/ld+json"]').textContent().then(JSON.parse);
    const faqJson = structured['@graph'].find(x=>x['@type']==='FAQPage');
    assert.equal(faqJson.mainEntity.length,await page.locator('.faq-list details').count());
    for (const q of faqJson.mainEntity) assert.ok((await page.locator('.faq-list').textContent()).includes(q.acceptedAnswer.text));
    // Реальные внешние каналы не подключены: форма должна объяснить недоступность, без ложного успеха.
    await page.locator('#name').fill('Тест проверки');
    await page.locator('#contact-value').fill('test@example.by');
    await page.locator('input[name=consent]').check();
    await page.getByRole('button',{name:'Отправить заявку'}).click();
    await page.waitForFunction(()=>document.querySelector('.form-feedback')?.textContent.includes('пока недоступен'));
    assert.equal(await page.locator('.form-feedback.success').count(),0);
    assert.equal(await page.locator('.form-feedback.error a').getAttribute('href'),'https://t.me/alexxstudio');
    await page.locator('#name').fill(''); await page.locator('#contact-value').fill(''); await page.locator('#message').fill('');
    await page.locator('input[name=consent]').uncheck();
    // Новый снимок чистой страницы, без тестовых значений и раскрытых FAQ.
    await page.goto(base,{waitUntil:'networkidle'});
    await page.screenshot({path:`${output}/desktop-${width}.png`,fullPage:true});
    await page.screenshot({path:`${output}/first-screen-${width}.png`});
    assert.deepEqual(errors,[]);
    results.push({width,height,status:'passed',overflow,font});
    await page.close();
  }
  const noJs=await browser.newPage({javaScriptEnabled:false});await noJs.goto(base);
  assert.ok((await noJs.locator('body').textContent()).includes('Контроль результатов'));
  assert.equal(await noJs.locator('h1').count(),1);await noJs.close();
  for (const route of ['/privacy','/robots.txt','/sitemap.xml','/llms.txt','/og.png','/icon.svg']) {
    const r=await fetch(base+route);assert.equal(r.status,200,route);
    if (route==='/privacy') assert.ok((await r.text()).includes('Предварительная версия'));
    if (route==='/sitemap.xml') assert.ok(!(await r.text()).includes('localhost'));
  }
  assert.equal((await fetch(base+'/does-not-exist')).status,404);
  console.log(JSON.stringify({results,noJavaScript:'passed',routes:'passed'},null,2));
  await fs.writeFile(`${output}/browser-results.json`,JSON.stringify(results,null,2));
} finally { await browser.close(); }
