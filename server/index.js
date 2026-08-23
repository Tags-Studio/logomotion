import express from 'express';
import multer from 'multer';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Vibrant from 'node-vibrant';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// ── Directories ──
const uploadsDir = path.join(__dirname, '../public/uploads');
const outDir     = path.join(__dirname, '../out');
const audioDir   = path.join(__dirname, '../public/audio');
[uploadsDir, outDir, audioDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Static ──
app.use(express.static(path.join(__dirname, '../public')));
app.use('/out', express.static(outDir));
app.use(express.json());

// ── Multer ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// ── Routes ──

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Editor page
app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/editor.html'));
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Extract Brand Colors from Logo ──
app.post('/extract-colors', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const palette  = await Vibrant.from(filePath).getPalette();

    const colors = Object.entries(palette)
      .filter(([, swatch]) => swatch != null)
      .sort((a, b) => (b[1].population || 0) - (a[1].population || 0))
      .map(([, swatch]) => swatch.hex)
      .slice(0, 6);

    // Fill to 6 colors if fewer extracted
    const defaults = ['#000000', '#ffffff', '#cccccc', '#888888', '#444444', '#eeeeee'];
    while (colors.length < 6) colors.push(defaults[colors.length]);

    // Also return the logo URL for the editor
    const logoFilename = req.file.filename;
    res.json({
      success: true,
      colors,
      logoUrl: `/uploads/${logoFilename}`,
      logoPath: filePath,
    });
  } catch (err) {
    console.error('Color extraction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Render Video ──
app.post('/render', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'customAudio', maxCount: 1 },
]), async (req, res) => {
  try {
    const files = req.files;
    if (!files?.logo?.[0]) return res.status(400).json({ error: 'Logo file required' });

    const logoFile = files.logo[0];
    const logoUrl  = `http://localhost:${PORT}/uploads/${logoFile.filename}`;

    // Parse settings
    const logoSize     = parseFloat(req.body.logoSize)  || 200;
    const logoX        = parseFloat(req.body.logoX)     || 0;
    const logoY        = parseFloat(req.body.logoY)     || 0;
    const brandColors  = JSON.parse(req.body.brandColors || '["#0047ff"]');
    const audioPreset  = req.body.audioPreset || 'none';
    const animStyle    = req.body.animatedStyle || 'standard';
    const fpsMulti     = parseInt(req.body.framesMultiplier) || 1; // 1x or 2x
    const style        = req.body.style || 'matchcut';

    // Audio URL
    let audioUrl = null;
    if (audioPreset !== 'none' && audioPreset !== 'custom') {
      const audioPath = path.join(audioDir, `audio${audioPreset}.mp3`);
      if (fs.existsSync(audioPath)) {
        audioUrl = `http://localhost:${PORT}/audio/audio${audioPreset}.mp3`;
      }
    } else if (audioPreset === 'custom' && files.customAudio?.[0]) {
      audioUrl = `http://localhost:${PORT}/uploads/${files.customAudio[0].filename}`;
    }

    const fps = fpsMulti === 2 ? 60 : 30;
    const compositionId = style === 'pulse' ? 'Pulse' : 'MatchCut';
    const outFile = path.join(outDir, `render-${Date.now()}.mp4`);

    const bundleDir = path.join(__dirname, '../src/remotion/index.jsx');

    console.log(`▶ Rendering [${compositionId}] @ ${fps}fps`);

    const bundled = await bundle({
      entryPoint: bundleDir,
      webpackOverride: (config) => config,
    });

    const inputProps = {
      logoUrl,
      logoSize,
      logoX,
      logoY,
      brandColors,
      audioUrl,
      animatedStyle: animStyle,
    };

    const composition = await selectComposition({
      serveUrl: bundled,
      id: compositionId,
      inputProps,
    });

    // Override fps if 2x
    if (fpsMulti === 2) {
      composition.fps = 60;
      composition.durationInFrames = composition.durationInFrames * 2;
    }

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outFile,
      inputProps,
      onProgress: ({ progress }) => {
        process.stdout.write(`  ${Math.round(progress * 100)}%\r`);
      },
    });

    console.log(`\n✅ Done: ${outFile}`);
    res.json({
      success: true,
      videoUrl: `/out/${path.basename(outFile)}`,
      filename: path.basename(outFile),
    });
  } catch (err) {
    console.error('❌ Render error:', err);
    res.status(500).json({ error: err.message || 'Render failed' });
  }
});

// ── Audio serve ──
app.get('/audio/:id', (req, res) => {
  const filePath = path.join(audioDir, `audio${req.params.id}.mp3`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Audio not found' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Logomotion Server → http://localhost:${PORT}\n`);
});
