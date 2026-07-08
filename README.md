# MatchPulse

Ứng dụng di động (Expo + React Native + TypeScript) để theo dõi thông tin trận đấu bóng đá: lịch thi đấu, kết quả, bảng xếp hạng, chi tiết đội và thông báo. Ứng dụng hỗ trợ dữ liệu mẫu để duyệt giao diện mà không cần backend.

---

## Tổng quan

- Xem lịch thi đấu và kết quả
- Xem bảng xếp hạng theo giải
- Xem chi tiết đội bóng và trận đấu
- Quản lý mục yêu thích và nhận thông báo
- Giao diện đã Việt hóa, phù hợp để kết nối API dữ liệu trận đấu thật nếu cần

Ứng dụng không liên quan tới đặt cược, cá cược hoặc giao dịch tiền thật.

---

## Công nghệ chính

- Expo (React Native) — SDK 54
- TypeScript
- Firebase (Auth, Firestore, Storage) — tùy chọn
- NativeWind / Tailwind CSS cho styling
- TanStack Query cho server-state, Zustand cho client-state

---

## Cài đặt & chạy

1. Cài dependencies:

```bash
npm install
```

2. Chạy ứng dụng (Expo):

```bash
npm run start
# hoặc
npx expo start
```

3. Chạy trực tiếp trên thiết bị/emulator:

```bash
npm run android
npm run ios
npm run web
```

> App có sẵn mock data để duyệt UI mà không cần kết nối đến Firebase.

### Cấu hình Firebase (khi muốn bật dữ liệu thật)

```bash
cp .env.example .env
```

Điền các biến môi trường Firebase (API key, projectId, authDomain, v.v.) theo mẫu trong `.env.example`.

---

## Cấu trúc mã nguồn (tổng quan)

app/                     Ứng dụng (routes, screens)
- (auth)/                Đăng nhập, đăng ký, quên mật khẩu
- (tabs)/                Tab chính: trang chủ, giải đấu, tìm kiếm, profile
- (admin)/               Các trang quản trị (nội dung/nguời dùng)
- match/[id].tsx         Chi tiết trận đấu
- league/[id].tsx        Trang giải đấu & bảng xếp hạng
- team/[id].tsx          Chi tiết đội
- notifications.tsx      Trung tâm thông báo
- favorites.tsx          Mục yêu thích

components/              Thành phần UI tái sử dụng
hooks/                   Hook tùy biến (auth, matches, v.v.)
services/                Lớp truy xuất dữ liệu
lib/firebase/            Khởi tạo Firebase (tùy chọn)
store/                   Zustand stores
types/, constants/, utils/ Các helpers và định nghĩa type

---

## Dữ liệu Firestore (ví dụ)

```
users/{uid}
matches/{matchId}
leagues/{leagueId}
teams/{teamId}
leaderboards/{period}
notifications/{notifId}
```

Chi tiết rule và index: `firestore.rules`, `firestore.indexes.json`.

---

Nếu bạn muốn, tôi có thể: cập nhật README tiếng Anh, thêm hướng dẫn chạy cụ thể cho Windows/macOS, hoặc tạo file `.env.example` mẫu nếu cần.
