import { logout, setAccessToken, store } from "@/store";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: '/api',
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

    // Nếu data là FormData, Axios sẽ tự động set Content-Type đúng.
    // Nếu data là object JSON, Axios cũng sẽ tự động set Content-Type là application/json nếu không có gì khác được chỉ định.
    if (!(config.data instanceof FormData) && config.headers && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[Axios Request Error]", error);
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
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.endsWith("auth/refresh") &&
      !originalRequest._retry &&
      originalRequest.headers?.Authorization
    ) {
      console.log(
        "[Axios Interceptor] Detected 401 on a protected route. Attempting token refresh for:",
        originalRequest.url,
      );
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
        console.log("[Axios Interceptor] Calling /auth/refresh...");
        // Tạo một instance axios mới cho việc refresh token để tránh interceptor của chính nó
        // gây ra vòng lặp nếu endpoint /auth/refresh cũng yêu cầu Authorization header (dù không nên)
        const refreshAxiosInstance = axios.create({
          withCredentials: true,
        });
        const { data } = await refreshAxiosInstance.post<{
          accessToken: string;
        }>(
          `auth/refresh`,
          {}, // Không cần body cho refresh token nếu backend đọc từ cookie
        );
        const newAccessToken = data.accessToken;
        console.log("[Axios Interceptor] Token refreshed successfully.");

        store.dispatch(setAccessToken(newAccessToken));
        if (originalRequest.headers)
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        const axiosRefreshError = refreshError as AxiosError;
        console.error(
          "[Axios Interceptor] Refresh token failed:",
          axiosRefreshError.response?.data || axiosRefreshError.message,
        );
        // Chỉ logout nếu lỗi thực sự từ endpoint refresh
        if (axiosRefreshError.config?.url?.endsWith("auth/refresh")) {
          store.dispatch(logout());
        }
        processQueue(axiosRefreshError, null);
        // Không nên tự động chuyển hướng ở đây, để component cha xử lý
        return Promise.reject(axiosRefreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu là lỗi 401 từ /auth/login hoặc /auth/register, hoặc các lỗi khác, thì không refresh.
    // Chỉ trả về lỗi gốc.
    if (
      error.response?.status === 401 &&
      (originalRequest.url?.endsWith("auth/login") ||
        originalRequest.url?.endsWith("auth/register"))
    ) {
      console.log(
        `[Axios Interceptor] 401 error from ${originalRequest.url}, not attempting refresh.`,
      );
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
