/* Reads intrinsic dimensions out of a WebP header without an image library.
   WebP is a RIFF container: "RIFF" <size> "WEBP" then a chunk. The chunk type
   tells us where the canvas size lives:
     VP8X  extended  -> 24-bit LE (w-1, h-1) at byte 24
     VP8L  lossless  -> 14-bit (w-1, h-1) packed after the 1-byte signature
     VP8   lossy     -> 14-bit (w, h) after the 3-byte frame start code
   Run: node _imgdims.cjs  */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "assets/img");

for (const f of fs.readdirSync(DIR).filter(n => /\.webp$/i.test(n))) {
  const b = fs.readFileSync(path.join(DIR, f));
  const tag = b.toString("ascii", 0, 4);
  const riff = b.toString("ascii", 8, 12);
  const chunk = b.toString("ascii", 12, 16);
  let w = null, h = null, how = null;

  if (tag !== "RIFF" || riff !== "WEBP") {
    console.log(f.padEnd(18), "NOT A WEBP (", tag, riff, ")");
    continue;
  }
  if (chunk === "VP8X") {
    w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    how = "VP8X extended";
  } else if (chunk === "VP8L") {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    w = (bits & 0x3FFF) + 1;
    h = ((bits >> 14) & 0x3FFF) + 1;
    how = "VP8L lossless";
  } else if (chunk === "VP8 ") {
    w = ((b[26] | (b[27] << 8)) & 0x3FFF);
    h = ((b[28] | (b[29] << 8)) & 0x3FFF);
    how = "VP8 lossy";
  }

  if (w && h) {
    console.log(
      f.padEnd(18),
      (w + "x" + h).padEnd(11),
      "ratio " + (w / h).toFixed(3).padStart(6),
      String((b.length / 1024).toFixed(1) + " KB").padStart(9),
      " " + how
    );
  } else {
    console.log(f.padEnd(18), "unknown chunk", chunk, "- dimensions not readable");
  }
}
