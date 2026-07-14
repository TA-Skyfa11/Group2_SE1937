const admin = require("firebase-admin");

// ====== CẤU HÌNH ======
// Sửa 2 dòng dưới đây trước khi chạy:
const serviceAccount = require("C:/Users/Administrator/Downloads/group2-se1937-firebase-adminsdk-fbsvc-5397f6c5ca.json");

// Email tài khoản cần cấp quyền admin — có thể sửa trực tiếp ở đây,
// hoặc truyền qua dòng lệnh: node set-admin-role.js email@cua-ban.com
const email = process.argv[2] ?? "admin@example.com";
// =======================

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  try {
    // Tìm user theo email
    const user = await admin.auth().getUserByEmail(email);

    // 1) Gán Custom Claim — bắt buộc để Firestore Security Rules cho phép
    //    ghi dữ liệu quản trị (matches/leagues/teams...). App KHÔNG đọc
    //    quyền admin từ đây để hiển thị UI.
    await admin.auth().setCustomUserClaims(user.uid, {
      role: "admin",
    });

    // 2) Cập nhật field `role` trong Firestore users/{uid} — đây mới là
    //    thứ app thực sự đọc để hiện menu "Trang quản trị" (RoleGuard /
    //    useAuth().isAdmin). Thiếu bước này thì dù đã có Custom Claim,
    //    người dùng vẫn không thấy giao diện Admin ở đâu cả.
    await admin.firestore().collection("users").doc(user.uid).set(
      { role: "admin", updatedAt: admin.firestore.Timestamp.now() },
      { merge: true }
    );

    // Kiểm tra lại
    const updatedUser = await admin.auth().getUser(user.uid);

    console.log("====================================");
    console.log("✅ ADMIN ROLE ASSIGNED SUCCESSFULLY");
    console.log("UID       :", updatedUser.uid);
    console.log("Email     :", updatedUser.email);
    console.log("Claims    :", updatedUser.customClaims);
    console.log("Firestore : role = admin ✓");
    console.log("====================================");
    console.log("⚠️ Người dùng cần đăng xuất và đăng nhập lại để có hiệu lực.");
  } catch (error) {
    console.error("❌ Failed to assign admin role:");
    console.error(error);
  } finally {
    await admin.app().delete();
  }
}

main();