# ⚽ MatchPulse

Xem tỷ số trực tiếp, lịch thi đấu, bảng xếp hạng — và dự đoán kết quả bằng coin ảo. Lấy cảm hứng từ SofaScore.

Xây dựng trên nền tảng **Expo SDK 54** (đúng chuẩn `npx create-expo-app`), TypeScript, Firebase và Clean Architecture.

---

## Tech Stack (Expo SDK 54.0.34 — verified compatible)

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo | ~54.0.34 |
| Runtime | React Native | 0.81.5 |
| UI Library | React | 19.1.0 |
| Navigation | Expo Router | ~5.0.0 |
| Language | TypeScript | ^5.8.0 |
| Styling | NativeWind | ^4.1.23 |
| Server state | TanStack Query | ^5.80.0 |
| Client state | Zustand | ^5.0.3 |
| Backend | Firebase (modular SDK) | ^11.0.0 |
| HTTP client | Axios | ^1.9.0 |
| Validation | Zod | ^3.25.0 |
| Notifications | expo-notifications | ~0.32.0 |

---

## Chạy thử ngay với Expo Go

```bash
npm install
npx expo start
```

Quét mã QR bằng app **Expo Go** — chạy được ngay, không cần build native.

> App có sẵn **mock data** (3 trận đấu mẫu, bảng xếp hạng, leaderboard) — không cần Firebase để duyệt UI. Đăng nhập bằng email/password bất kỳ; dùng email chứa chữ `admin` để vào quyền Quản trị viên.

### Cấu hình Firebase (khi cần dữ liệu thật)

```bash
cp .env.example .env
```

Điền thông tin project Firebase (Authentication Email/Password + Firestore + Storage đã bật).

---

## Kiến trúc

```
app/
├── (auth)/                 Đăng nhập, Đăng ký, Quên mật khẩu
├── (tabs)/                 Trang chủ, Giải đấu, Tìm kiếm, Dự đoán, Cá nhân
├── (admin)/                Dashboard, Người dùng, Tỷ lệ, Coin (chỉ Admin)
├── match/[id].tsx           Chi tiết trận đấu (Tổng quan/Chỉ số/Diễn biến/Đội hình/Dự đoán)
├── league/[id].tsx          Trận đấu + Bảng xếp hạng theo giải
├── team/[id].tsx             Chi tiết đội bóng + danh sách cầu thủ
├── notifications.tsx         Trung tâm thông báo
├── transactions.tsx          Lịch sử giao dịch coin
└── favorites.tsx             Đội bóng & trận đấu yêu thích

components/                # UI thuần — MatchCard, PredictionSheet, OddsButton...
hooks/                     # Business logic — useAuth, useMatches, usePredictions...
services/                  # Data access — matchService, predictionService, leaderboardService...
lib/firebase/              # Khởi tạo Firebase (Auth, Firestore, Storage, Messaging)
store/                      # Zustand (authStore, predictionStore, uiStore)
types/, constants/, utils/  # Nền tảng chung toàn app
```

---

## Vai trò & Quyền hạn

| Vai trò | Chức năng |
|---|---|
| **Guest** | Xem tỷ số, lịch thi đấu, bảng xếp hạng, đội bóng |
| **User** | + Dự đoán kết quả bằng coin ảo, theo dõi đội yêu thích, nhận thông báo |
| **Admin** | + Quản lý tỷ lệ dự đoán, điều chỉnh coin người dùng, quản lý tài khoản |

---

## Hệ thống dự đoán (Prediction System)

⚠️ **Không phải cá cược thật** — chỉ dùng coin ảo, mang tính giáo dục/giải trí, không liên quan tiền thật.

- Mỗi người dùng mới nhận **1.000 coin ảo** khi đăng ký
- Dự đoán 3 kết quả: **Chủ nhà thắng / Hòa / Khách thắng**
- Tiền thắng = Số coin cược × Tỷ lệ tại thời điểm đặt
- **Tỷ lệ động (dynamic odds)** — tự động điều chỉnh theo tỷ lệ phân bổ dự đoán của cộng đồng (mô hình pari-mutuel + biên lợi nhà cái 10%)
- Giao dịch đặt cược/chia thưởng xử lý qua **Firestore Transaction** — đảm bảo không có race-condition khi nhiều người cược cùng lúc
- **Bảng xếp hạng (Leaderboard)** — tính theo công thức: `coin × 0.4 + tỷ lệ thắng × 300 + số dự đoán × 0.3 + streak × 7.5`

---

## Dữ liệu Firestore

```
users/{uid}
matches/{matchId}
leagues/{leagueId}
teams/{teamId}
predictions/{predictionId}
leaderboards/{period}
notifications/{notifId}
```

Định nghĩa type đầy đủ tại `types/`. Security Rules tại `firestore.rules`, indexes tại `firestore.indexes.json`.

---

## Ghi chú

- Toàn bộ UI đã Việt hóa; các ký hiệu bóng đá quốc tế (FT, HT, vs) được giữ nguyên theo chuẩn chung.
- Dữ liệu trận đấu hiện dùng mock data; có thể nối API bóng đá thật (football-data.org, API-Football...) qua lớp `services/` mà không cần đổi UI.
- Kiến trúc tách lớp rõ ràng: UI (`app/`, `components/`) không gọi Firebase trực tiếp — luôn đi qua `hooks/` → `services/`.
