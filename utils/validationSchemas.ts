import * as yup from "yup";

// Dùng chung cho Login / Register / Forgot password — validate bằng Yup,
// quản lý state form bằng Formik (xem app/(auth)/*.tsx).

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu"),
});

export const registerSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .required("Vui lòng nhập tên hiển thị")
    .min(2, "Tên hiển thị phải có ít nhất 2 ký tự")
    .max(50, "Tên hiển thị tối đa 50 ký tự"),
  username: yup
    .string()
    .trim()
    .required("Vui lòng nhập tên đăng nhập")
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(20, "Tên đăng nhập tối đa 20 ký tự")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Tên đăng nhập chỉ gồm chữ, số và dấu gạch dưới (_)"
    ),
  email: yup
    .string()
    .trim()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: yup
    .string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([yup.ref("password")], "Mật khẩu không khớp"),
});

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
});
