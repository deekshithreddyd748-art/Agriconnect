import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';

const KEYFRAMES = [
  { id: 's1_crest', frame: 95 },
  { id: 's1_landing', frame: 290 },
  { id: 's2_machinery', frame: 580 },
  { id: 's2_labour', frame: 690 },
  { id: 's2_facility', frame: 800 },
  { id: 's2_pillars', frame: 1020 },
  { id: 's3_login_typing', frame: 1290 },
  { id: 's3_login_ready', frame: 1355 },
  { id: 's3_role_farmer', frame: 1490 },
  { id: 's3_role_provider', frame: 1620 },
  { id: 's4_dashboard', frame: 1920 },
  { id: 's4_marketplace', frame: 2320 },
  { id: 's4_booking_sent', frame: 2510 },
  { id: 's5_equip', frame: 2790 },
  { id: 's5_labour', frame: 3090 },
  { id: 's5_facility', frame: 3390 },
  { id: 's6_map_pending', frame: 3940 },
  { id: 's6_accepted', frame: 4160 },
  { id: 's7_montage', frame: 4460 },
  { id: 's7_closing', frame: 4720 },
];

async function main() {
  const outDir = path.resolve('output/keyframes');
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Bundling Remotion composition...');
  const serveUrl = await bundle({
    entryPoint: path.resolve('src/index.js'),
  });

  const browser = await openBrowser('chrome');
  try {
    const composition = await selectComposition({
      serveUrl,
      id: 'AgriConnectTutorial',
      inputProps: { showSubtitles: false },
      puppeteerInstance: browser,
    });

    for (const kf of KEYFRAMES) {
      const output = path.join(outDir, `${kf.id}.png`);
      await renderStill({
        composition,
        serveUrl,
        output,
        frame: kf.frame,
        inputProps: { showSubtitles: false },
        puppeteerInstance: browser,
        muted: true,
      });
      console.log(`Rendered ${kf.id}.png (frame ${kf.frame})`);
    }
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
