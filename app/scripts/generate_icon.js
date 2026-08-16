const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a valid 256x256 PNG icon with a nice notepad icon
function generateIcon() {
  const width = 256;
  const height = 256;

  // Uncompressed RGBA rows: 1 filter byte (0) + 256*4 bytes per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle notepad background with blue header accent
      const margin = 20;
      const cornerR = 24;
      const inBox = x >= margin && x < width - margin && y >= margin && y < height - margin;

      if (inBox) {
        // Top banner header (Blue)
        if (y < 70) {
          rawData[pxOffset] = 59;     // R
          rawData[pxOffset + 1] = 130; // G
          rawData[pxOffset + 2] = 246; // B
          rawData[pxOffset + 3] = 255; // A
        } else {
          // Notepad paper body (Off-white / Slate dark)
          // Draw notepad text lines
          const isLine = (y === 105 || y === 135 || y === 165 || y === 195) && x >= 45 && x <= 210;
          if (isLine) {
            rawData[pxOffset] = 100;
            rawData[pxOffset + 1] = 116;
            rawData[pxOffset + 2] = 139;
            rawData[pxOffset + 3] = 255;
          } else {
            rawData[pxOffset] = 30;
            rawData[pxOffset + 1] = 30;
            rawData[pxOffset + 2] = 36;
            rawData[pxOffset + 3] = 255;
          }
        }
      } else {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  
  const iconsDir = path.join(__dirname, '..', 'src', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(iconsDir, 'icon.png'), pngBuffer);
  console.log('Generated icon.png at src/icons/icon.png');
}

function createChunk(type, data) {
  const length = data.length;
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);

  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc, 4 + body.length);
  return chunk;
}

// CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

generateIcon();
