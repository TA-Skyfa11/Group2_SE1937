# MatchPulse — Backend đồng bộ dữ liệu bóng đá thật

## Test API key ngay lập tức (không cần Firebase)

Đã có sẵn script test độc lập ở thư mục gốc project — chạy được ngay, không cần cài gì:

```bash
node test-football-api.js
```

Nếu thấy `✅ Thành công!` là API key hoạt động tốt. Việc setup Firebase bên dưới có thể làm sau, không ảnh hưởng gì đến bước test này.

---

Cloud Functions này lấy dữ liệu thật từ **football-data.org** và ghi vào Firestore, để app đọc thay cho mock data.

## Kiến trúc

```
football-data.org API
        │
        ▼ (gọi định kỳ, API key giữ ở server — KHÔNG lộ ra client)
Cloud Functions (functions/src/)
        │
        ▼ (ghi bằng Admin SDK — luôn bypass Security Rules)
Firestore: leagues/ · matches/ · teams/
        │
        ▼ (đọc qua Security Rules: allow read: if true)
App React Native (đã có sẵn code đọc Firestore, không cần sửa gì)
```

3 job chạy tự động:

| Function | Lịch chạy | Việc làm |
|---|---|---|
| `syncLeaguesJob` | 1 lần/ngày (3:00 sáng) | Đồng bộ tên, logo 5 giải đấu |
| `syncStandingsJob` | Mỗi 60 phút | Đồng bộ bảng xếp hạng |
| `syncMatchesJob` | Mỗi 10 phút | Đồng bộ trận đấu (lịch/tỷ số/kết quả) + tự tạo `teams/` |

Ngoài ra có `manualSync` — 1 HTTP endpoint để **test ngay lập tức**, không cần đợi lịch chạy.

**Quan trọng:** Cloud Functions **không đụng vào** field `odds` và `predictionStats` khi cập nhật trận đã tồn tại — 2 field này do hệ thống dự đoán trong app tự quản lý, tránh bị đồng bộ ghi đè mất tỷ lệ đang có người cược.

---

## Bước 1 — Lấy API key football-data.org

1. Vào https://www.football-data.org/client/register
2. Đăng ký free (không cần thẻ)
3. Vào trang tài khoản → copy **API Token**

## Bước 2 — Cài Firebase CLI (nếu chưa có)

```bash
npm install -g firebase-tools
firebase login
```

## Bước 3 — Liên kết đúng Firebase project

```bash
cd matchpulse
firebase use --add
```

Chọn đúng project Firebase bạn đã tạo trước đó (project chứa Firestore mà app đang dùng).

## Bước 4 — Nâng cấp gói Blaze (bắt buộc để gọi API bên ngoài)

Vào [Firebase Console](https://console.firebase.google.com) → chọn project → góc trái dưới **"Upgrade"** → chọn **Blaze (Pay as you go)**.

> Cần thêm thẻ để xác minh, nhưng có **2 triệu lượt gọi function/tháng miễn phí** — với lịch chạy trên (~150 lượt/ngày), gần như chắc chắn **không mất phí**.

## Bước 5 — Cài dependency cho Cloud Functions

```bash
cd functions
npm install
cd ..
```

## Bước 6 — Set 2 secret (API key không bao giờ nằm trong code)

> 💡 File `functions/.secret.local` đã được điền sẵn API key bạn vừa lấy (chỉ dùng khi chạy Firebase Emulator ở máy local, không dùng khi deploy thật, và file này **không commit lên Git**). Khi deploy lên Cloud thật, vẫn cần chạy 2 lệnh dưới đây — dán đúng giá trị đã có trong `.secret.local`.

```bash
firebase functions:secrets:set FOOTBALL_DATA_API_KEY
```
→ Dán API token từ Bước 1 khi được hỏi.

```bash
firebase functions:secrets:set SYNC_TRIGGER_KEY
```
→ Tự nghĩ ra 1 chuỗi bất kỳ (vd: `matchpulse-test-2026`) — dùng để bảo vệ endpoint test thủ công khỏi bị người lạ gọi tùy tiện (tốn quota API).

## Bước 7 — Deploy

```bash
firebase deploy --only functions
```

Lần đầu deploy mất khoảng 2-3 phút. Xong sẽ thấy 4 function: `syncLeaguesJob`, `syncStandingsJob`, `syncMatchesJob`, `manualSync`.

## Bước 8 — Test ngay (không cần đợi lịch chạy)

Copy URL của `manualSync` hiện trong log deploy (dạng `https://asia-southeast1-<project-id>.cloudfunctions.net/manualSync`), mở trình duyệt:

```
https://asia-southeast1-<project-id>.cloudfunctions.net/manualSync?key=matchpulse-test-2026&job=all
```

(thay `<project-id>` và `key` đúng giá trị bạn đã set ở Bước 6)

Thấy `{"ok":true,"job":"all"}` là thành công. Kiểm tra trong Firebase Console → Firestore → phải thấy collection `leagues`, `matches`, `teams` có dữ liệu thật.

## Bước 9 — Xem log nếu lỗi

```bash
firebase functions:log
```

## Bước 10 — Trỏ app vào Firebase thật

Điền `.env` của app (thư mục gốc, không phải `functions/`) với config Firebase thật:

```bash
cp .env.example .env
```

Điền đủ 6 biến `EXPO_PUBLIC_FIREBASE_*` lấy từ Firebase Console → Project Settings → General → Your apps → SDK config.

Chạy lại app:

```bash
npx expo start -c
```

App sẽ tự động phát hiện có `EXPO_PUBLIC_FIREBASE_PROJECT_ID` thật → `USE_MOCK` tự chuyển `false` → đọc dữ liệu trận đấu **thật** từ Firestore thay vì mock data.

---

## Lưu ý về `?job=`

Endpoint `manualSync` nhận tham số `job` để chạy riêng lẻ khi cần:

- `?job=leagues` — chỉ đồng bộ giải đấu
- `?job=standings` — chỉ đồng bộ BXH
- `?job=matches` — chỉ đồng bộ trận đấu
- `?job=all` (mặc định) — chạy cả 3

## Giới hạn cần biết

- Tỷ số **cập nhật mỗi 10 phút**, không phải tức thời từng giây (do free tier football-data.org không hỗ trợ push/websocket)
- Trường `minute` (phút trận đấu đang diễn ra) là **ước lượng** từ giờ bắt đầu, không phải số liệu chính thức (football-data.org free tier không trả về field này)
- Không có dữ liệu cầu thủ/đội hình chi tiết (`players`, `lineups`) — free tier football-data.org không cung cấp; nếu cần, phải nâng cấp gói trả phí hoặc đổi provider
