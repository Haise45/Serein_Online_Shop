import { logout, setAccessToken, store } from "@/store";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Xác định xem code đang chạy ở client hay server
const IS_SERVER = typeof window === "undefined";

let apiBaseUrl: string;

if (IS_SERVER) {
  // Khi ở server, chúng ta cần URL tuyệt đối đến backend API
  // Đảm bảo các biến môi trường này được set đúng cho môi trường server của Next.js
  if (process.env.NODE_ENV === "development") {
    apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"; // URL backend API mà server Next.js có thể gọi
  } else {
    apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://online-store-pb1l.onrender.com/api/v1"; // URL backend API cho production
  }
} else {
  // Khi ở client, chúng ta có thể dùng path tương đối '/api' để Next.js rewrites xử lý
  apiBaseUrl = "/api";
}

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken;
    // Chỉ thêm Authorization header nếu token tồn tại VÀ request không phải là đến endpoint refresh
    // Các endpoint như login, register thường không cần token này
    if (token && config.headers && !config.url?.endsWith("auth/refresh")) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Lấy locale hiện tại từ URL của trình duyệt client-side
    // Chúng ta không thể dùng hook ở đây vì đây là một file JS/TS thông thường
    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split("/");
      // Giả sử locale luôn là segment đầu tiên sau domain, ví dụ /en/products
      // Hoặc nếu không có, nó là ngôn ngữ mặc định
      const potentialLocale = pathSegments[1];
      const supportedLocales = ["vi", "en"]; // Đồng bộ với middleware của bạn

      let currentLocale = "vi"; // Mặc định
      if (supportedLocales.includes(potentialLocale)) {
        currentLocale = potentialLocale;
      }

      // Gắn vào header
      if (config.headers) {
        config.headers["Accept-Language"] = currentLocale;
      }
    }

    // Nếu data là FormData, Axios sẽ tự động set Content-Type đúng.
    // Nếu data là object JSON, Axios cũng sẽ tự động set Content-Type là application/json nếu không có gì khác được chỉ định.
    if (
      !(config.data instanceof FormData) &&
      config.headers &&
      !config.headers["Content-Type"]
    ) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // --- LOGIC TỰ ĐỘNG LOGOUT KHI GẶP LỖI 403 (Forbidden) ---
    // Đây là trường hợp tài khoản bị đình chỉ hoặc không có quyền admin.
    if (error.response?.status === 403) {
      // Hiển thị thông báo cho người dùng biết lý do
      const apiErrorData = error.response.data as { message?: string };
      const errorMessage =
        apiErrorData?.message ||
        "Bạn không có quyền thực hiện hành động này. Đang đăng xuất.";

      // Dispatch action logout để xóa state và token
      store.dispatch(logout());

      // Reject promise để dừng chuỗi xử lý hiện tại
      return Promise.reject(new Error(errorMessage));
    }
    // --- KẾT THÚC LOGIC TỰ ĐỘNG LOGOUT ---

    // *** BƯỚC 1: Xử lý lỗi 401 để refresh token ***
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.endsWith("auth/refresh") &&
      !originalRequest._retry &&
      originalRequest.headers?.Authorization
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers)
              originalRequest.headers["Authorization"] = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshAxiosInstance = axios.create({
          withCredentials: true,
        });
        const { data } = await refreshAxiosInstance.post<{
          accessToken: string;
        }>(
          `${apiBaseUrl}/auth/refresh`, // Đảm bảo URL tuyệt đối
          {},
        );
        const newAccessToken = data.accessToken;

        store.dispatch(setAccessToken(newAccessToken));
        if (originalRequest.headers)
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        const axiosRefreshError = refreshError as AxiosError;
        if (axiosRefreshError.config?.url?.endsWith("auth/refresh")) {
          store.dispatch(logout());
        }
        processQueue(axiosRefreshError, null);
        return Promise.reject(axiosRefreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // *** BƯỚC 2: XỬ LÝ CÁC LỖI KHÁC (ví dụ 400, 404, 500) ***
    // Khối này được thêm vào để trích xuất thông điệp lỗi từ backend
    if (error.response) {
      // Lấy dữ liệu lỗi từ body của response
      const apiErrorData = error.response.data as { message?: string };

      // Nếu có trường `message` trong dữ liệu lỗi, tạo một Error object mới
      // với thông điệp đó. Đây là thông điệp mà người dùng sẽ thấy.
      if (apiErrorData && typeof apiErrorData.message === "string") {
        const customError = new Error(apiErrorData.message);
        return Promise.reject(customError);
      }
    }

    // *** BƯỚC 3: Trả về lỗi gốc nếu không rơi vào các trường hợp trên ***
    // (Ví dụ: lỗi mạng, lỗi CORS, hoặc lỗi không có `message` trong body)
    return Promise.reject(error);
  },
);

export default axiosInstance;
