import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  Video,
  AbsoluteFill,
} from 'remotion';

/**
 * MatchCut Style:
 * Phase 1 (0-40f):   Logo enters — scale 0.5→1 + fade in
 * Phase 2 (40-70f):  Hold logo on black background
 * Phase 3 (70-120f): Iris-wipe (circle) expands from logo center revealing BG video
 *                    Logo shrinks to corner watermark
 */

export const MatchCut = ({ logoUrl, bgUrl }) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // ── Phase 1: Logo intro (0 → 40) ──
  const logoScale = interpolate(frame, [0, 40], [0.4, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Phase 3: Logo → watermark (70 → 110) ──
  const logoShrinkScale = interpolate(frame, [70, 110], [1, 0.18], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoX = interpolate(frame, [70, 110], [width / 2 - 200, width - 150], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoY = interpolate(frame, [70, 110], [height / 2 - 200, 120], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── Phase 3: Iris wipe radius (70 → 115) ──
  const maxRadius = Math.sqrt(width ** 2 + height ** 2);
  const irisRadius = interpolate(frame, [70, 115], [0, maxRadius], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgOpacity = interpolate(frame, [70, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Determine which phase we're in for logo positioning
  const isPhase3 = frame >= 70;

  const currentLogoScale = isPhase3 ? logoShrinkScale : logoScale;
  const currentLogoLeft = isPhase3 ? logoX : width / 2 - 200;
  const currentLogoTop = isPhase3 ? logoY : height / 2 - 200;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* BG Video with iris clip */}
      {bgUrl && frame >= 70 && (
        <AbsoluteFill style={{ opacity: bgOpacity }}>
          <svg
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
            }}
          >
            <defs>
              <clipPath id="iris" clipPathUnits="userSpaceOnUse">
                <circle cx={width / 2} cy={height / 2} r={irisRadius} />
              </clipPath>
            </defs>
          </svg>
          <AbsoluteFill style={{ clipPath: `circle(${irisRadius}px at ${width / 2}px ${height / 2}px)` }}>
            <Video
              src={bgUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* Black overlay for when no BG video */}
      {(!bgUrl || frame < 70) && (
        <AbsoluteFill style={{ backgroundColor: '#000000' }} />
      )}

      {/* Logo */}
      <div
        style={{
          position: 'absolute',
          left: currentLogoLeft,
          top: currentLogoTop,
          width: 400,
          height: 400,
          transform: `scale(${currentLogoScale})`,
          transformOrigin: 'top left',
          opacity: logoOpacity,
          transition: 'none',
        }}
      >
        <Img
          src={logoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.3))',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
