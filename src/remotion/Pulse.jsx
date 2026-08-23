import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  Video,
  AbsoluteFill,
  spring,
} from 'remotion';

/**
 * Pulse Style:
 * - Logo appears with a pulsing glow / ripple effect
 * - Each pulse radiates outward from the logo center
 * - BG video fades in gradually behind the pulses
 * - Logo stays centered and prominent throughout
 */

const PulseRing = ({ startFrame, delay, color, width: w, height: h }) => {
  const frame = useCurrentFrame();
  const relFrame = frame - startFrame - delay;

  const radius = interpolate(relFrame, [0, 60], [0, Math.max(w, h) * 0.7], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(relFrame, [0, 20, 60], [0, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (relFrame < 0) return null;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: w / 2 - radius,
          top: h / 2 - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: '50%',
          border: `4px solid ${color}`,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};

export const Pulse = ({ logoUrl, bgUrl }) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // Logo fade in
  const logoOpacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoScale = spring({
    fps,
    frame,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
    from: 0.5,
    to: 1,
    durationInFrames: 40,
  });

  // BG fade in (after pulses start)
  const bgOpacity = interpolate(frame, [30, 80], [0, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulse colors
  const pulseColor = '#ffffff';

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* BG Video */}
      {bgUrl && (
        <AbsoluteFill style={{ opacity: bgOpacity }}>
          <Video
            src={bgUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AbsoluteFill>
      )}

      {/* Dark overlay for readability */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

      {/* Pulse Rings — every 30 frames, 3 rings total */}
      {[0, 30, 60, 90, 120].map((delay, i) => (
        <PulseRing
          key={i}
          startFrame={20}
          delay={delay}
          color={pulseColor}
          width={width}
          height={height}
        />
      ))}

      {/* Logo centered */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 420,
            height: 420,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <Img
            src={logoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: `drop-shadow(0 0 40px rgba(255,255,255,${Math.min(logoOpacity, 0.6)})) drop-shadow(0 0 80px rgba(255,255,255,0.2))`,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
