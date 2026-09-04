import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = 'https://fairplay-biz.lovable.app';
const assets = [
  'hero-handshake-AmqZaoPt.jpg',
  'team-quiet-B--hISTx.jpg',
  'track-dawn-BKoKPHzv.jpg',
  'support-DTEVOB27.jpg',
];

const outDir = path.resolve('public/assets');
await mkdir(outDir, { recursive: true });

for (const file of assets) {
  const url = `${base}/assets/${file}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Failed', file, res.status);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const localName = file.replace(/-[A-Za-z0-9]+\.(jpg|png|webp)$/i, '.$1');
  await writeFile(path.join(outDir, localName), buf);
  console.log('Saved', localName, buf.length);
}
