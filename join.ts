const PNG = require("pngjs").PNG;
const fs = require("fs");

function joinRaw(imgs: any[]) {
  const { width, height } = imgs[0];
  const res = new PNG({ width, height: height * imgs.length });
  const len = width * height;
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    img.data.copy(res.data, len * 4 * i, 0, len * 4);
  }
  return res;
}

export function joinImages(imgs: Buffer[]) {
  if (imgs.length === 1) {
    return imgs[0];
  }
  return PNG.sync.write(joinRaw(imgs.map((el) => PNG.sync.read(el))));
}

function test_join() {
  fs.writeFileSync(
    "./mock/res.png",
    joinImages([
      fs.readFileSync("./mock/img1.png"),
      fs.readFileSync("./mock/img2.png"),
      fs.readFileSync("./mock/img2.png"),
      fs.readFileSync("./mock/img2.png"),
      fs.readFileSync("./mock/img2.png"),
      fs.readFileSync("./mock/img2.png"),
    ])
  );
}
