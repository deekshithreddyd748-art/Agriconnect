import math
import os
import struct
import wave

SAMPLE_RATE = 44100


def write_stereo_wav(path, left_samples, right_samples):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for l, r in zip(left_samples, right_samples):
            li = max(-32767, min(32767, int(l * 32767)))
            ri = max(-32767, min(32767, int(r * 32767)))
            frames.extend(struct.pack("<hh", li, ri))
        wf.writeframes(frames)


def generate_bgm(duration_sec=170.0, out_path="audio/bgm.wav"):
    """Synthesize a gentle, original warm D-major acoustic ambient bed."""
    n = int(duration_sec * SAMPLE_RATE)
    left = [0.0] * n
    right = [0.0] * n

    # Warm chord progression: Dmaj7 -> Bm7 -> Gmaj7 -> A6 (4 sec per chord, 16 sec loop)
    chords = [
        [146.83, 220.00, 277.18, 369.99],  # D3, A3, C#4, F#4
        [123.47, 185.00, 220.00, 293.66],  # B2, F#3, A3, D4
        [98.00, 146.83, 246.94, 369.99],   # G2, D3, B3, F#4
        [110.00, 164.81, 220.00, 277.18],  # A2, E3, A3, C#4
    ]
    arp_notes = [
        293.66, 369.99, 440.00, 554.37,
        293.66, 440.00, 587.33, 440.00,
    ]

    two_pi = 2.0 * math.pi
    for i in range(n):
        t = i / SAMPLE_RATE
        # Global fade-in (2s) and fade-out (3s)
        env = 1.0
        if t < 2.0:
            env = t / 2.0
        elif t > duration_sec - 3.0:
            env = max(0.0, (duration_sec - t) / 3.0)

        chord_idx = int(t // 4.0) % len(chords)
        chord_pos = (t % 4.0) / 4.0
        chord_env = math.sin(math.pi * chord_pos) ** 0.35

        pad_l = 0.0
        pad_r = 0.0
        freqs = chords[chord_idx]
        for idx, f in enumerate(freqs):
            detune = 1.0 + (idx - 1.5) * 0.0012
            val = math.sin(two_pi * f * t) + 0.25 * math.sin(two_pi * f * detune * t)
            pan = 0.35 + (idx / max(1, len(freqs) - 1)) * 0.3
            pad_l += val * (1.0 - pan) * 0.055
            pad_r += val * pan * 0.055

        # Soft plucked acoustic chime every 0.5s
        step_t = t % 0.5
        step_idx = int(t / 0.5) % len(arp_notes)
        note_f = arp_notes[step_idx]
        pluck_env = math.exp(-step_t * 6.5) * (1.0 - math.exp(-step_t * 140.0))
        pluck = (
            math.sin(two_pi * note_f * t)
            + 0.3 * math.sin(two_pi * note_f * 2.0 * t)
        ) * pluck_env * 0.045

        stereo_shift = 0.5 + 0.18 * math.sin(t * 0.6)
        sample_l = (pad_l * chord_env + pluck * (1.0 - stereo_shift)) * env
        sample_r = (pad_r * chord_env + pluck * stereo_shift) * env
        left[i] = sample_l
        right[i] = sample_r

    write_stereo_wav(out_path, left, right)


def generate_transition_sfx(out_path="audio/sfx_transition.wav"):
    """Create a subtle, clean 0.45s chime-whoosh transition sound."""
    dur = 0.45
    n = int(dur * SAMPLE_RATE)
    left = [0.0] * n
    right = [0.0] * n
    two_pi = 2.0 * math.pi
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (t / dur)) * math.exp(-t * 4.5)
        tone = 0.5 * math.sin(two_pi * 587.33 * t) + 0.35 * math.sin(two_pi * 880.0 * t)
        s = tone * env * 0.14
        left[i] = s
        right[i] = s
    write_stereo_wav(out_path, left, right)


if __name__ == "__main__":
    generate_bgm()
    generate_transition_sfx()
    print("Generated audio/bgm.wav and audio/sfx_transition.wav")
