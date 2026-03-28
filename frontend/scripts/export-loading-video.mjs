/**
 * Records the Lynkr loading animation (lynkr-loading-animation.html) to an MP4 file.
 * Requires: ffmpeg on PATH, and puppeteer + puppeteer-screen-recorder installed.
 *
 * Usage (from frontend dir): node scripts/export-loading-video.mjs
 * Output: lynkr-loading-animation.mp4 in the frontend directory.
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, "..");
const htmlPath = path.join(frontendDir, "lynkr-loading-animation.html");
const outPath = path.join(frontendDir, "lynkr-loading-animation.mp4");

const VIEWPORT = { width: 400, height: 720 };
const DURATION_MS = 6000;

async function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error("Missing lynkr-loading-animation.html in frontend directory.");
    process.exit(1);
  }

  let puppeteer, PuppeteerScreenRecorder;
  try {
    puppeteer = (await import("puppeteer")).default;
    PuppeteerScreenRecorder = (await import("puppeteer-screen-recorder")).PuppeteerScreenRecorder;
  } catch (e) {
    console.error(
      "Install recording deps from frontend dir: yarn add -D puppeteer puppeteer-screen-recorder"
    );
    console.error("Also ensure ffmpeg is installed and on your PATH.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    const fileUrl = "file://" + htmlPath.replace(/\\/g, "/");
    await page.goto(fileUrl, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.body.style.background = "hsl(0 0% 2%)");

    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: false,
      fps: 30,
      videoFrame: { width: VIEWPORT.width, height: VIEWPORT.height },
      videoCrf: 18,
      videoCodec: "libx264",
      videoPreset: "medium",
      videoBitrate: 2500,
    });

    await recorder.start(outPath);
    await new Promise((r) => setTimeout(r, DURATION_MS));
    await recorder.stop();
    console.log("Saved:", outPath);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
