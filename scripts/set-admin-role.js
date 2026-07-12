const admin = require("firebase-admin");

// ====== CẤU HÌNH ======
const serviceAccount = require("C:/Users/Administrator/Downloads/group2-se1937-firebase-adminsdk-fbsvc-5397f6c5ca.json");

// Email tài khoản cần cấp quyền admin
const email = "admin@gmail.com";
// =======================

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  try {
    // Tìm user theo email
    const user = await admin.auth().getUserByEmail(email);

    // Gán custom claim
    await admin.auth().setCustomUserClaims(user.uid, {
      role: "admin",
    });

    // Kiểm tra lại
    const updatedUser = await admin.auth().getUser(user.uid);

    console.log("====================================");
    console.log("✅ ADMIN ROLE ASSIGNED SUCCESSFULLY");
    console.log("UID   :", updatedUser.uid);
    console.log("Email :", updatedUser.email);
    console.log("Claims:", updatedUser.customClaims);
    console.log("====================================");
    console.log("⚠️ Người dùng cần đăng xuất và đăng nhập lại để Custom Claim có hiệu lực.");
  } catch (error) {
    console.error("❌ Failed to assign admin role:");
    console.error(error);
  } finally {
    await admin.app().delete();
  }
}

main();