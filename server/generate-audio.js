import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(__dirname, '../public/audio');
fs.mkdirSync(audioDir, { recursive: true });

// Minimal valid silent MP3 frame (MPEG 1 Layer 3, 128kbps, 44.1kHz, stereo)
// Repeating this frame produces a clean, valid silent MP3 file
const mp3Frame = Buffer.from([
  0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

for (let i = 1; i <= 6; i++) {
  const filePath = path.join(audioDir, `audio${i}.mp3`);
  // 150 frames ~ 4 seconds of audio
  const frames = [];
  for (let f = 0; f < 150; f++) {
    frames.push(mp3Frame);
  }
  fs.writeFileSync(filePath, Buffer.concat(frames));
  console.log(`Generated audio preset: audio${i}.mp3`);
}
