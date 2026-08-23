import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
  Audio,
  AbsoluteFill,
  spring,
} from 'remotion';

/* ═══════════════════════════════════════════════════════════════
   CONCRETE TEXTURE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
const ConcretePanel = ({ shadowSide = 'bottom', shadowOpacity = 0.5 }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    {/* Base concrete gradient */}
    <div style={{
      position: 'absolute', inset: 0,
      background: `
        linear-gradient(
          160deg,
          #b0aca6 0%,
          #9a9690 15%,
          #88847e 30%,
          #7a7672 45%,
          #848078 60%,
          #929088 75%,
          #a09e98 90%,
          #8a8882 100%
        )
      `,
    }}/>

    {/* Noise texture via SVG turbulence */}
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="cnoise" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.72 0.80"
          numOctaves="5"
          seed="8"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix type="saturate" values="0.15" in="noise" result="grayNoise"/>
        <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#cnoise)" opacity="1"/>
    </svg>

    {/* Subtle horizontal crack lines */}
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {[15, 32, 58, 71, 85].map((y, i) => (
        <line key={i} x1="0" y1={`${y}%`} x2="100%" y2={`${y + (i % 2 === 0 ? 0.3 : -0.2)}%`}
          stroke="#3a3632" strokeWidth={i === 2 ? 1.5 : 0.8}/>
      ))}
    </svg>

    {/* Edge shadow for depth */}
    <div style={{
      position: 'absolute',
      [shadowSide === 'bottom' ? 'bottom' : 'top']: 0,
      left: 0, right: 0,
      height: 120,
      background: `linear-gradient(to ${shadowSide}, transparent, rgba(0,0,0,${shadowOpacity}))`,
    }}/>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MATCH CUT COMPOSITION
   ═══════════════════════════════════════════════════════════════ */
export const MatchCut = ({
  logoUrl,
  logoSize       = 200,
  logoX          = 0,      // -50 to +50 percent
  logoY          = 0,      // -50 to +50 percent
  brandColors    = ['#0047ff'],
  audioUrl       = null,
  animatedStyle  = 'standard', // standard | softer | fewer-cuts
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // Animation timing based on style
  const timing = {
    standard:   { foldStart: 15, foldEnd: 70, logoIn: 65, logoFull: 90 },
    softer:     { foldStart: 10, foldEnd: 85, logoIn: 75, logoFull: 100 },
    'fewer-cuts': { foldStart: 25, foldEnd: 60, logoIn: 55, logoFull: 80 },
  }[animatedStyle] || { foldStart: 15, foldEnd: 70, logoIn: 65, logoFull: 90 };

  const { foldStart, foldEnd, logoIn, logoFull } = timing;

  // Easing options
  const foldEase = animatedStyle === 'softer'
    ? Easing.out(Easing.quad)
    : Easing.bezier(0.25, 0.1, 0.25, 1);

  // ── Fold progress (0 = closed, 1 = fully open) ──
  const foldProgress = interpolate(frame, [foldStart, foldEnd], [0, 1], {
    easing: foldEase,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Top panel rotates backward (-Y axis)
  const topAngle = interpolate(foldProgress, [0, 1], [0, -88]);
  // Bottom panel rotates forward (+Y axis)
  const bottomAngle = interpolate(foldProgress, [0, 1], [0, 88]);

  // Shadow on panels fades as they open
  const panelShadow = interpolate(foldProgress, [0, 1], [0, 0.6]);

  // ── Logo appearance ──
  const logoOpacity = interpolate(frame, [logoIn, logoFull], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoScale = spring({
    fps,
    frame: Math.max(0, frame - logoIn),
    config: { damping: 14, stiffness: 90, mass: 0.9 },
    from: 0.7,
    to: 1,
    durationInFrames: 40,
  });

  // Brand color (primary)
  const primaryColor = brandColors?.[0] || '#0047ff';

  // Logo size in pixels (logoSize prop = 50–300, maps to actual pixel size)
  const logoPixelSize = (logoSize / 200) * Math.min(width * 0.7, 600);

  // Logo position offset (percent → pixels)
  const logoOffsetX = (logoX / 100) * width;
  const logoOffsetY = (logoY / 100) * height;

  return (
    <AbsoluteFill style={{ background: '#000' }}>

      {/* ── Audio ── */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* ── Brand color card (behind panels) ── */}
      <AbsoluteFill style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Centered card */}
        <div style={{
          width: Math.min(width * 0.8, 700),
          height: Math.min(height * 0.35, 480),
          background: primaryColor,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateX(${logoOffsetX}px) translateY(${logoOffsetY}px)`,
          boxShadow: `0 0 80px rgba(0,0,0,0.6)`,
          opacity: logoOpacity,
        }}>
          <div style={{
            transform: `scale(${logoScale})`,
            transformOrigin: 'center center',
          }}>
            <Img
              src={logoUrl}
              style={{
                width: logoPixelSize,
                height: logoPixelSize,
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      </AbsoluteFill>

      {/* ── TOP concrete panel ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '50%',
        perspective: '700px',
        perspectiveOrigin: 'center bottom',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          transformOrigin: 'center bottom',
          transform: `rotateX(${topAngle}deg)`,
          backfaceVisibility: 'hidden',
          position: 'relative',
        }}>
          <ConcretePanel shadowSide="bottom" shadowOpacity={0.4 + panelShadow * 0.3} />
          {/* Dark overlay that appears as it folds (inner face) */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.25)',
            opacity: Math.min(1, foldProgress * 1.5),
          }}/>
        </div>
      </div>

      {/* ── BOTTOM concrete panel ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '50%',
        perspective: '700px',
        perspectiveOrigin: 'center top',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          transformOrigin: 'center top',
          transform: `rotateX(${bottomAngle}deg)`,
          backfaceVisibility: 'hidden',
          position: 'relative',
        }}>
          <ConcretePanel shadowSide="top" shadowOpacity={0.4 + panelShadow * 0.3} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.25)',
            opacity: Math.min(1, foldProgress * 1.5),
          }}/>
        </div>
      </div>

      {/* ── Center crease shadow (fades as panels open) ── */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0, right: 0,
        height: 40,
        marginTop: -20,
        background: 'rgba(0,0,0,0.7)',
        opacity: Math.max(0, 1 - foldProgress * 2),
        filter: 'blur(8px)',
      }}/>

      {/* ── Vignette overlay ── */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
        pointerEvents: 'none',
      }}/>

    </AbsoluteFill>
  );
};
