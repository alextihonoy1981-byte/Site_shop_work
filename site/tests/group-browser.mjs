import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

const experts = JSON.parse(await fs.readFile(new URL('../content/experts.json', import.meta.url), 'utf8'));
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const output = process.env.TEST_OUTPUT_DIR || '../content/previews/group';
await fs.mkdir(output, {recursive:true});
const browser = await chromium.launch({executablePath:process.env.BROWSER_PATH || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true});
const results=[];
try {
  for(const width of [320,390,768,820,900,1024,1440,1920]) {
    const page = await browser.newPage({viewport:{width,height:width<801?844:1000},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base,{waitUntil:'networkidle'});
    assert.equal(await page.locator('img').count(),0,'Site must not contain photographs');
    assert.equal(await page.locator('.expert-profile').count(),experts.length);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
    if(await page.locator('#main-navigation').isVisible()) {
      const brand=await page.locator('.header .brand').boundingBox();
      const nav=await page.locator('#main-navigation').boundingBox();
      assert.ok(brand.x+brand.width<=nav.x,'header overlap '+width);
    } else {
      assert.ok(await page.locator('#menu-toggle').isVisible(),'responsive menu must remain accessible');
    }
    const type=await page.locator('.hero-summary,.situation>p,.expert-summary,.expert-practice-item>p:not(.practice-category),.service-row>p,.process-steps p').evaluateAll(nodes=>nodes.map(node=>({font:parseFloat(getComputedStyle(node).fontSize),line:parseFloat(getComputedStyle(node).lineHeight)})));
    assert.ok(type.every(item=>item.font>=18 && item.line>=item.font*1.6),'body copy must remain large and comfortably spaced');
    for(const expert of experts) {
      const profile=page.locator(`#expert-${expert.id}`);
      assert.ok((await profile.textContent()).includes(expert.name));
      await profile.locator('.text-link').click();
      assert.equal(await page.locator('#message').inputValue(),expert.task);
    }
    const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
    assert.equal(graph.filter(item=>item['@type']==='Person').length,experts.length);
    assert.equal(graph.find(item=>item['@type']==='Organization').member.length,experts.length);
    assert.deepEqual(errors,[]);
    if([390,900,1440].includes(width)) {
      await page.goto(base,{waitUntil:'networkidle'});
      await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});
      await page.screenshot({path:`${output}/first-screen-${width}.png`});
      await page.screenshot({path:`${output}/full-page-${width}.png`,fullPage:true});
      await page.locator('#experts').screenshot({path:`${output}/experts-${width}.png`,style:'.header,.skip-link{visibility:hidden!important}'});
    }
    results.push({width,photos:0,profiles:experts.length,status:'passed'});
    await page.close();
  }
  console.log(JSON.stringify(results,null,2));
  await fs.writeFile(`${output}/group-results.json`,JSON.stringify(results,null,2));
} finally {await browser.close()}
