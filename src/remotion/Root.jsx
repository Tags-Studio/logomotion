import { Composition } from 'remotion';
import { MatchCut } from './MatchCut.jsx';
import { Pulse } from './Pulse.jsx';

const FPS = 30;
const DURATION_MATCHCUT = 4 * FPS; // 4 seconds = 120 frames
const DURATION_PULSE = 5 * FPS;    // 5 seconds = 150 frames
const WIDTH = 1080;
const HEIGHT = 1920;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MatchCut"
        component={MatchCut}
        durationInFrames={DURATION_MATCHCUT}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          logoUrl: 'https://via.placeholder.com/400x400/000/fff?text=LOGO',
          bgUrl: null,
        }}
      />
      <Composition
        id="Pulse"
        component={Pulse}
        durationInFrames={DURATION_PULSE}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          logoUrl: 'https://via.placeholder.com/400x400/000/fff?text=LOGO',
          bgUrl: null,
        }}
      />
    </>
  );
};
