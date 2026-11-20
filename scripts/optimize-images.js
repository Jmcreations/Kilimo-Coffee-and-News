const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const directories = [
  path.resolve(__dirname, '..', 'public', 'Images'),
  path.resolve(__dirname, '..', 'backend', 'uploads')
];

async function optimizeDirectory(directory) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;

    const source = path.join(directory, entry.name);
    const extension = path.extname(entry.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(extension)) continue;

    const metadata = await sharp(source).metadata();
    const width = metadata.width;
    let pipeline = sharp(source).rotate();

    if (width && width > 1600) {
      pipeline = pipeline.resize({ width: 1600, withoutEnlargement: true });
    }

    if (extension === '.png') {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    } else {
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    }

    const temporary = `${source}.optimized`;
    await pipeline.toFile(temporary);
    fs.renameSync(temporary, source);
  }
}

async function main() {
  for (const directory of directories) {
    await optimizeDirectory(directory);
  }
  console.log('Image optimization complete.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
