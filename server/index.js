import express from 'express';
import multer from 'multer';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const app = express();
const PORT = process.env.PORT || 4000;

// Directories
const uploadsDir = path.join(__dirname, '../public/uploads');
const outDir = path.join(__dirname, '../out');
[uploadsDir, outDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/out', express.static(outDir));

// Multer: accept logo (image) + bg (video)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'logo') {
      if (!file.mimetype.match(/^image\//)) return cb(new Error('Logo must be an image'));
    }
    if (file.fieldname === 'bg') {
      if (!file.mimetype.match(/^video\//)) return cb(new Error('Background must be a video'));
    }
    cb(null, true);
  },
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Render endpoint
app.post(
  '/render',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'bg', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      if (!files?.logo?.[0]) return res.status(400).json({ error: 'Logo file required' });

      const logoFile = files.logo[0];
      const bgFile = files.bg?.[0];
      const style = req.body.style || 'matchcut'; // matchcut | pulse

      // Paths accessible from the browser (served at /uploads/...)
      const logoUrl = `http://localhost:${PORT}/uploads/${logoFile.filename}`;
      const bgUrl = bgFile ? `http://localhost:${PORT}/uploads/${bgFile.filename}` : null;

      const compositionId = style === 'pulse' ? 'Pulse' : 'MatchCut';
      const outFile = path.join(outDir, `render-${Date.now()}.mp4`);

      const bundleDir = path.join(__dirname, '../src/remotion/index.jsx');

      console.log(`▶ Rendering composition: ${compositionId}`);
      console.log(`  Logo: ${logoUrl}`);
      console.log(`  BG: ${bgUrl}`);

      // Bundle entry point
      const { bundle } = await import('@remotion/bundler');
      const bundled = await bundle({
        entryPoint: bundleDir,
        webpackOverride: (config) => config,
      });

      const composition = await selectComposition({
        serveUrl: bundled,
        id: compositionId,
        inputProps: { logoUrl, bgUrl },
      });

      await renderMedia({
        composition,
        serveUrl: bundled,
        codec: 'h264',
        outputLocation: outFile,
        inputProps: { logoUrl, bgUrl },
        onProgress: ({ progress }) => {
          process.stdout.write(`  Progress: ${Math.round(progress * 100)}%\r`);
        },
      });

      console.log(`\n✅ Render done: ${outFile}`);

      const outFilename = path.basename(outFile);
      res.json({
        success: true,
        videoUrl: `/out/${outFilename}`,
        filename: outFilename,
      });
    } catch (err) {
      console.error('❌ Render error:', err);
      res.status(500).json({ error: err.message || 'Render failed' });
    }
  }
);

app.listen(PORT, () => {
  console.log(`\n🚀 Logomotion Server running at http://localhost:${PORT}\n`);
});
