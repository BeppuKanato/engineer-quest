const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { Container } = require("@mui/material");
const puppeteer = require("../../back/node_modules/puppeteer");
const source = fs.readFileSync(path.resolve(__dirname, "../src/components/layouts/PageLayout.tsx"), "utf8");
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports: exportsObject, require });
const { PageLayout } = exportsObject;
// Independent, pre-extraction Container contracts; no API/authentication fixtures.
const originals = {
  main: { maxWidth: 1440, py: { xs: 3, md: 4 } },
  breadcrumbs: { maxWidth: 1440, pt: { xs: 3, md: 4 } },
  detail: { maxWidth: 1120, pt: 3, pb: 4 },
  reading: { maxWidth: 960, pt: 3, pb: 4 },
  creationList: { maxWidth: 1180, pt: 3, pb: 4 },
  works: { maxWidth: 1080, pt: 3, pb: 4 },
  workspace: { maxWidth: 1440, pt: 3, pb: 3 },
  collection: { pt: 3, pb: 5 },
};
async function main() {
  const browser = await puppeteer.launch({ headless: true });
  let checks = 0;
  try {
    const page = await browser.newPage();
    for (const [width,height] of [[799,640],[1366,768],[1536,864],[2560,1440]]) {
      await page.setViewport({ width,height });
      for (const [variant,sx] of Object.entries(originals)) {
        const old = React.createElement(Container, { maxWidth: variant === "collection" ? "lg" : false, sx }, "Fixture");
        const next = React.createElement(PageLayout, { variant }, "Fixture");
        await page.setContent('<!doctype html><div id="old">'+renderToStaticMarkup(old)+'</div><div id="next">'+renderToStaticMarkup(next)+'</div>');
        const measure = await page.evaluate(() => ["old","next"].map(id => {
          const element = document.querySelector('#'+id+' .MuiContainer-root');
          const box = element.getBoundingClientRect(), style = getComputedStyle(element);
          return { width: box.width, left: box.left, maxWidth: style.maxWidth, padding: [style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft] };
        }));
        assert.deepEqual(measure[1],measure[0],variant+' at '+width+'x'+height);
        checks++;
      }
    }
    console.log('Page layouts: '+checks+' browser comparisons preserve width, centering and responsive padding.');
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});