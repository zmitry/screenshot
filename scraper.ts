import { chromium, Page, Browser } from "playwright";
import { joinImages } from "./join";
const express = require("express");
const bodyParser = require("body-parser");
const notp = require("notp");
const genericPool = require("generic-pool");

async function screenshot(page: Page, htmlContent: string, config, name) {
  await page.setViewportSize({
    width: config.width,
    height: config.height,
  });
  await page.setContent(htmlContent, {
    waitUntil: "networkidle",
  });
  let res = await page.screenshot();
  return res;
}

function prepareBrowsers() {
  const res = [chromium].map(async (el) => {
    console.time("start:" + el.name());
    let context = await el.launch({
      timeout: 60000,
    });
    let res = {
      name: el.name(),
      context: context,
      pagePool: setupPool(context),
    };
    console.timeEnd("start:" + res.name);
    return res;
  });
  return res;
}

async function timed<T>(k, name, fn: () => T) {
  let n = name + ":" + k;
  console.time(n);
  let res = await fn();
  console.timeEnd(n);
  return res;
}
async function handleScreenshot(browsers: { name: string; pagePool }[], html, config) {
  let results = [];
  let k = Math.random();

  const promises = browsers.map(async ({ name, pagePool }) => {
    console.time(name + ":" + k);
    const page = await timed(k, "acquire:" + name, () => pagePool.acquire());
    let res = await timed(k, "screenshot " + name, () => screenshot(page, html, config, name));
    await pagePool.release(page);
    console.timeEnd(name + ":" + k);
    return res;
  });

  results = await Promise.all(promises);
  const resultData = await timed(k, "join", () => joinImages(results));

  return { buffer: resultData };
}

function setupPool(browser: Browser) {
  const factory = {
    async validate(page) {
      try {
        await page.reload();
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    create: async function () {
      let page = await browser.newPage();
      await page.goto("about:blank");
      return page;
    },
    destroy: function (page) {
      return page.close();
    },
  };

  return genericPool.createPool(factory, { max: 5, min: 1 });
}

async function main() {
  const token = process.env.TOKEN;
  const port = process.env.PORT || 9000;
  const app = express();
  app.use(bodyParser.json({ limit: "5mb" }));
  app.disable("etag");
  const browsers = prepareBrowsers();
  app.post("/screenshot", async (req, res) => {
    if (token) {
      let allowed = notp.totp.verify(req.body.otpToken, token);
      if (!allowed) {
        res.status(403);
        res.send("denied").end();
        return;
      }
    }
    const body = req.body;
    const config = {
      width: body.width || 300,
      height: body.height || 600,
    };
    try {
      const { buffer } = await handleScreenshot(await Promise.all(browsers), req.body.html, config);
      app.set("etag", false);
      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "attachment; filename=image.jpg",
        "Content-Length": buffer.length,
      });
      res.set("Connection", "close").status(200).send(buffer).end();
    } catch (e) {
      console.error(e);
      res.set(400).send(JSON.stringify(e));
    }
  });
  app.listen(port, "0.0.0.0", () => {
    console.log(`app listening at http://localhost:${port}`);
  });
}

main();

export {};
