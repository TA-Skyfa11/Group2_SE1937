/**
 * Script test độc lập — xác nhận API key football-data.org hoạt động.
 * KHÔNG cần Firebase, KHÔNG cần npm install (chỉ dùng module có sẵn của Node).
 *
 * Chạy:
 *   node test-football-api.js
 */

const https = require("https");

const API_KEY = "c308a8c288bb41e8b0b0aba7ef841a75";
const HOST = "api.football-data.org";
const PATH = "/v4/competitions/PL"; // Premier League — 1 request duy nhất để test

function request(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: HOST,
        path,
        method: "GET",
        headers: { "X-Auth-Token": API_KEY },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log(`→ Đang gọi https://${HOST}${PATH} ...\n`);

  const { status, headers, body } = await request(PATH);

  console.log(`Status: ${status}`);
  console.log(`Requests còn lại trong phút này: ${headers["x-requests-available-minute"] ?? "?"}`);
  console.log(`Reset sau: ${headers["x-requestcounter-reset"] ?? "?"}s\n`);

  if (status !== 200) {
    console.error("❌ Lỗi — kiểm tra lại API key hoặc kết nối mạng.");
    console.error(body);
    process.exit(1);
  }

  const data = JSON.parse(body);
  console.log("✅ Thành công! Dữ liệu giải đấu nhận được:");
  console.log(`   Tên: ${data.name}`);
  console.log(`   Mã: ${data.code}`);
  console.log(`   Mùa giải hiện tại: ${data.currentSeason?.startDate} → ${data.currentSeason?.endDate}`);
  console.log(`   Matchday hiện tại: ${data.currentSeason?.currentMatchday}`);
  console.log("\n→ API key hoạt động tốt. Có thể yên tâm dùng cho Cloud Functions sau này.");
}

main().catch((err) => {
  console.error("❌ Lỗi kết nối:", err.message);
  process.exit(1);
});
