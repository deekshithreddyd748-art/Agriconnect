param(
  [string]$OutDir = "audio"
)

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
Add-Type -AssemblyName System.Speech

$scenes = @(
  @{ id = "scene1"; text = "Introducing AgriConnect, a digital platform designed to simplify access to agricultural services and connect farmers with nearby service providers." },
  @{ id = "scene2"; text = "Finding reliable machinery, available labour, and suitable agricultural facilities can be challenging. AgriConnect brings these essential services together through one simple platform." },
  @{ id = "scene3"; text = "Users can access AgriConnect through a simple interface and select the role that matches their needs. Each user gets access to relevant services and dashboard features." },
  @{ id = "scene4"; text = "Farmers can explore available machinery, discover labour services, and find agricultural facilities. They can view relevant service information and submit booking requests through the platform." },
  @{ id = "scene5"; text = "AgriConnect also empowers service providers. Equipment owners can manage machinery listings, labour providers can present their skills and availability, and facility owners can showcase their agricultural services." },
  @{ id = "scene6"; text = "With location based discovery, users can explore nearby agricultural resources. The booking system helps connect farmers and service providers through a simple service request workflow." },
  @{ id = "scene7"; text = "AgriConnect brings agricultural services closer to the farming community through a simple and connected digital platform. AgriConnect, connecting farmers, empowering agriculture." }
)

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
# Prefer natural crisp female/male voice installed
$voices = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
if ($voices -contains "Microsoft Zira Desktop") {
  $synth.SelectVoice("Microsoft Zira Desktop")
}
$synth.Rate = 0
$synth.Volume = 100

foreach ($sc in $scenes) {
  $wavPath = Join-Path $OutDir ($sc.id + ".wav")
  $synth.SetOutputToWaveFile($wavPath)
  $synth.Speak($sc.text)
  $synth.SetOutputToNull()
  Write-Output ("Synthesized " + $wavPath)
}

$synth.Dispose()
