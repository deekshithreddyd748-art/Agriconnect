import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { FPS, SCENES, TOTAL_FRAMES } from './timeline';
import { Scene1Intro } from './scenes/Scene1Intro';
import { Scene2ProblemSolution } from './scenes/Scene2ProblemSolution';
import { Scene3UserAccess } from './scenes/Scene3UserAccess';
import { Scene4FarmerDashboard } from './scenes/Scene4FarmerDashboard';
import { Scene5ProviderDashboards } from './scenes/Scene5ProviderDashboards';
import { Scene6NearbyMapAndBooking } from './scenes/Scene6NearbyMapAndBooking';
import { Scene7Closing } from './scenes/Scene7Closing';
import { SubtitleBar } from './components/SubtitleBar';

const SCENE_COMPONENTS = [
  Scene1Intro,
  Scene2ProblemSolution,
  Scene3UserAccess,
  Scene4FarmerDashboard,
  Scene5ProviderDashboards,
  Scene6NearbyMapAndBooking,
  Scene7Closing,
];

const CrossfadeWrapper = ({ durationFrames, children }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationFrames - 12, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
};

export const AgriConnectTutorial = ({ showSubtitles = true }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0B2E18',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Original Gentle Ambient Instrumental Background Music (ducked neatly behind narration) */}
      <Audio
        src={staticFile('audio/bgm.wav')}
        volume={(f) =>
          interpolate(
            f,
            [0, 30, TOTAL_FRAMES - 60, TOTAL_FRAMES],
            [0.05, 0.22, 0.22, 0.02],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          )
        }
      />

      {SCENES.map((scene, index) => {
        const Component = SCENE_COMPONENTS[index];
        const fromFrame = scene.startSec * FPS;
        const durationFrames = scene.durationSec * FPS;

        return (
          <Sequence key={scene.id} from={fromFrame} durationInFrames={durationFrames}>
            <CrossfadeWrapper durationFrames={durationFrames}>
              <Component />
            </CrossfadeWrapper>

            <Sequence from={8}>
              <Audio src={staticFile(`audio/${scene.id}.wav`)} volume={1.0} />
            </Sequence>

            {index > 0 && (
              <Audio src={staticFile('audio/sfx_transition.wav')} volume={0.35} />
            )}
          </Sequence>
        );
      })}

      {showSubtitles && <SubtitleBar />}
    </AbsoluteFill>
  );
};
