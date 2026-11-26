import React from 'react';
import { Composition } from 'remotion';
import { AgriConnectTutorial } from './AgriConnectTutorial';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './timeline';

export const RemotionRoot = () => {
  return (
    <Composition
      id="AgriConnectTutorial"
      component={AgriConnectTutorial}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ showSubtitles: true }}
    />
  );
};
