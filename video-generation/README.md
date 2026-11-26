# AgriConnect Tutorial & Product Launch Video (`Team ANOKA`)

Programmatic 1080p @ 30fps (16:9) product demonstration & tutorial video built with **Remotion + React + Offline Speech Synthesis + Python Audio Synthesis** using the real updated AgriConnect UI architecture and assets.

## Directory Structure

- `src/` — Remotion compositions (`AgriConnectTutorial.jsx`, `timeline.js`, 7 animated scenes, `BrowserFrame.jsx`, `SubtitleBar.jsx`).
- `assets/` & `public/` — Agricultural 16:9 visual assets (`hero-farmer.jpg`, `machinery-tractor.jpg`, `labour-farm-team.jpg`, `storage-warehouse.jpg`) & SVGs.
- `scripts/` — `generate_voiceover.ps1` (narration tracks), `generate_music.py` (original D-major ambient instrumental + transition chime), `build_srt.mjs` (SRT generator).
- `audio/` — Generated narration WAV tracks (`scene1.wav`–`scene7.wav`), `bgm.wav`, `sfx_transition.wav`.
- `subtitles/` — Generated `AgriConnect_Tutorial.srt`.
- `output/` — Final rendered video `AgriConnect_Tutorial.mp4` (`1920x1080`, `30fps`, `H.264 / AAC`).
- `STORYBOARD_AND_SCRIPT.md` — Full scene breakdown and narration script.

## Regenerating the Video

```bash
cd video-generation

# 1. (Optional) Regenerate background music, voice-over tracks, and SRT subtitles
python scripts/generate_music.py
powershell -ExecutionPolicy Bypass -File scripts/generate_voiceover.ps1 -OutDir audio
node scripts/build_srt.mjs
cp audio/*.wav public/audio/

# 2. Install isolated dependencies
npm install

# 3. Render final 1080p MP4
npm run render
```

The rendered file will be saved at `video-generation/output/AgriConnect_Tutorial.mp4`.
