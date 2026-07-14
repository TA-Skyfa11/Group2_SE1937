// Firebase trả lỗi dạng "Firebase: Error (auth/invalid-credential)." — kỹ
// thuật, khó hiểu và bằng tiếng Anh. Map sang tiếng Việt dễ hiểu, dùng để
// gắn lỗi ngay vào field của Formik (không hiện qua Toast/thông báo chung
// chung nữa).

const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email hoặc mật khẩu không đúng",
  "auth/wrong-password": "Email hoặc mật khẩu không đúng",
  "auth/user-not-found": "Email hoặc mật khẩu không đúng",
  "auth/invalid-email": "Email không hợp lệ",
  "auth/user-disabled": "Tài khoản này đã bị vô hiệu hóa",
  "auth/too-many-requests": "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.",
  "auth/network-request-failed": "Lỗi kết nối mạng. Vui lòng kiểm tra internet.",
  "auth/email-already-in-use": "Email này đã được đăng ký",
  "auth/weak-password": "Mật khẩu quá yếu, vui lòng chọn mật khẩu khác",
  "auth/operation-not-allowed": "Phương thức đăng nhập này hiện chưa được bật",
  "auth/missing-password": "Vui lòng nhập mật khẩu",
};

// Nhận vào 1 lỗi bất kỳ (Firebase hoặc lỗi tự ném ra), trả về message
// tiếng Việt an toàn để hiện cho người dùng.
export function getFriendlyAuthErrorMessage(error: any): string {
  const code: string | undefined = error?.code;
  if (code && FIREBASE_AUTH_ERROR_MESSAGES[code]) {
    return FIREBASE_AUTH_ERROR_MESSAGES[code];
  }
  // Lỗi tự ném ra trong code (vd: "Tài khoản của bạn đã bị khóa...") đã
  // sẵn tiếng Việt và thân thiện — dùng thẳng, không cần map.
  if (error?.message && !code) {
    return error.message;
  }
  return "Không thể xử lý yêu cầu. Vui lòng thử lại.";
}

// Với lỗi sai email/mật khẩu lúc đăng nhập: cố tình KHÔNG nói rõ là email
// hay mật khẩu sai (để tránh lộ thông tin email nào đã tồn tại trong hệ
// thống) — trả về true nếu đây là loại lỗi "sai thông tin đăng nhập" cần
// gắn lên cả 2 field email + password.
export function isInvalidCredentialError(error: any): boolean {
  return ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(
    error?.code
  );
}

export function isEmailAlreadyInUseError(error: any): boolean {
  return error?.code === "auth/email-already-in-use";
}

// Dùng cho các màn Admin (Firestore, không phải Auth). Trước đây mọi lỗi
// đều hiện chung 1 câu "có thể chưa có Custom Claim admin" — gây hiểu
// lầm khi nguyên nhân thực ra là thiếu composite index (một lỗi Firestore
// hoàn toàn khác, `failed-precondition`, không phải `permission-denied`).
export function getAdminQueryErrorMessage(error: any): string {
  const code = error?.code;
  if (code === "permission-denied") {
    return "Tài khoản này chưa có Custom Claim admin (hoặc token đã cũ). Chạy scripts/set-admin-role.js rồi đăng xuất/đăng nhập lại.";
  }
  if (code === "failed-precondition") {
    // Firestore thường trả kèm link tạo index ngay trong message gốc —
    // hiện nguyên message đó ra vì nó chính xác và hữu ích hơn bất kỳ câu
    // nào mình tự viết.
    return `Thiếu Firestore Index cho truy vấn này. Chạy "firebase deploy --only firestore:indexes" rồi đợi vài phút. Chi tiết: ${error?.message ?? ""}`;
  }
  return `Đã có lỗi khi tải dữ liệu: ${error?.message ?? "không rõ nguyên nhân"}`;
}
