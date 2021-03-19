const fetch = require("node-fetch");
const fs = require("fs");
function request(i) {
  const file = fs.readFileSync("./mock/t1.html", "utf-8");
  console.time(i);
  fetch("https://frontend-screenshot-56pctahobq-ue.a.run.app/screenshot", {
    // fetch("http://localhost:9000/screenshot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      width: 1280,
      height: 900,
      html: file,
    }),
  }).then(async (res) => {
    console.log(res.status);
    console.timeEnd(i);
  });
}

for (let i = 0; i < 50; i++) {
  request(i);
}
