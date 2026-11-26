$ErrorActionPreference = "Stop"
$ff = (Resolve-Path ".\node_modules\ffmpeg-static\ffmpeg.exe").Path

# Smooth 20-shot cinematic timeline summing cleanly to 165.0s (with 0.5s xfade overlaps):
# Total raw sum = 165.0 + 19 * 0.5 = 174.5s across 20 shots!
$shots = @(
  @{ file = "s1_crest.png"; dur = 7.0; zoom = "zoom+0.0005" },
  @{ file = "s1_landing.png"; dur = 12.0; zoom = "zoom+0.00025" },
  @{ file = "s2_machinery.png"; dur = 4.5; zoom = "zoom+0.0006" },
  @{ file = "s2_labour.png"; dur = 4.5; zoom = "zoom+0.0006" },
  @{ file = "s2_facility.png"; dur = 4.5; zoom = "zoom+0.0006" },
  @{ file = "s2_pillars.png"; dur = 8.0; zoom = "zoom+0.0003" },
  @{ file = "s3_login_typing.png"; dur = 5.5; zoom = "zoom+0.0002" },
  @{ file = "s3_login_ready.png"; dur = 5.5; zoom = "zoom+0.0002" },
  @{ file = "s3_role_farmer.png"; dur = 5.0; zoom = "zoom+0.0002" },
  @{ file = "s3_role_provider.png"; dur = 5.5; zoom = "zoom+0.0002" },
  @{ file = "s4_dashboard.png"; dur = 13.5; zoom = "zoom+0.0002" },
  @{ file = "s4_marketplace.png"; dur = 9.5; zoom = "zoom+0.00025" },
  @{ file = "s4_booking_sent.png"; dur = 8.5; zoom = "zoom+0.0002" },
  @{ file = "s5_equip.png"; dur = 10.5; zoom = "zoom+0.0002" },
  @{ file = "s5_labour.png"; dur = 10.5; zoom = "zoom+0.0002" },
  @{ file = "s5_facility.png"; dur = 10.5; zoom = "zoom+0.0002" },
  @{ file = "s6_map_pending.png"; dur = 14.0; zoom = "zoom+0.0002" },
  @{ file = "s6_accepted.png"; dur = 14.0; zoom = "zoom+0.0002" },
  @{ file = "s7_montage.png"; dur = 8.5; zoom = "zoom+0.0004" },
  @{ file = "s7_closing.png"; dur = 13.5; zoom = "zoom+0.0003" }
)

$inputs = @()
$filters = @()
$n = $shots.Count
$fade = 0.5

for ($i = 0; $i -lt $n; $i++) {
  $sh = $shots[$i]
  $inputs += @("-i", "output/keyframes/$($sh.file)")
  $frames = [int]($sh.dur * 30)
  $filters += "[$($i):v]scale=2112:1188,zoompan=z='min(zoom+0.00025,1.06)':d=$($frames):x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,format=yuv420p[v$i]"
}

$prev = "v0"
$offset = $shots[0].dur - $fade
$trans = @("fade","slideleft","fade","fade","fade","wipeleft","fade","slideleft","fade","fade","slideleft","fade","wipeleft","slideleft","slideleft","fade","wipeleft","fade","fade")

for ($i = 1; $i -lt $n; $i++) {
  $outLbl = if ($i -eq ($n - 1)) { "vmixed" } else { "xf$i" }
  $tr = $trans[$i - 1]
  $filters += "[$prev][v$i]xfade=transition=$($tr):duration=$($fade):offset=$($offset)[$outLbl]"
  $prev = $outLbl
  if ($i -lt ($n - 1)) {
    $offset = [math]::Round($offset + $shots[$i].dur - $fade, 2)
  }
}

$assEscaped = "subtitles/AgriConnect_Tutorial.ass"
$filters += "[vmixed]ass='$assEscaped'[vfinal]"

$filterComplex = $filters -join ";"
$inputs += @("-i", "audio/master_audio.m4a")

$ffmpegArgs = $inputs + @(
  "-filter_complex", $filterComplex,
  "-map", "[vfinal]",
  "-map", "$($n):a",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "19",
  "-pix_fmt", "yuv420p",
  "-c:a", "copy",
  "-shortest",
  "-movflags", "+faststart",
  "-y",
  "output/AgriConnect_Tutorial.mp4"
)

Write-Host "Encoding 1920x1080 @ 30fps H.264/AAC video via FFmpeg..."
& $ff @ffmpegArgs
if ($LASTEXITCODE -ne 0) {
  throw "FFmpeg exited with code $LASTEXITCODE"
}
Write-Host "Successfully rendered output/AgriConnect_Tutorial.mp4"
