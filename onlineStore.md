# Serein Shop - Dự án E-commerce Hiện Đại

Một dự án website thương mại điện tử (e-commerce) full-stack được xây dựng bằng Next.js và Node.js, áp dụng kiến trúc hiện đại, hỗ trợ đa ngôn ngữ, đa tiền tệ và cung cấp trải nghiệm quản trị toàn diện.

## 📝 Description

Serein Shop là một nền tảng mua sắm trực tuyến hoàn chỉnh, được thiết kế để mang lại trải nghiệm người dùng mượt mà, trực quan ở phía khách hàng và một hệ thống quản trị mạnh mẽ, giàu tính năng cho quản trị viên ở phía backend. Dự án thể hiện sự kết hợp giữa các công nghệ web hiện đại để giải quyết các bài toán thực tế trong lĩnh vực thương mại điện tử.

### 1. Tổng quan & Tính năng chính

Trang web được chia thành hai khu vực chính với các tính năng chuyên biệt:

#### ✨ Giao diện Khách hàng (Client)

- **Trải nghiệm Đa ngôn ngữ & Đa tiền tệ:** Người dùng có thể chuyển đổi linh hoạt giữa Tiếng Việt (VND) và Tiếng Anh (USD). Giao diện, dữ liệu sản phẩm và giá cả sẽ tự động cập nhật theo lựa chọn, với tỷ giá được lấy real-time.
- **Trang chủ động:** Hiển thị các banner quảng cáo, sản phẩm nổi bật và sản phẩm mới nhất được quản lý hoàn toàn từ trang admin.
- **Duyệt sản phẩm nâng cao:** Trang danh sách sản phẩm với bộ lọc đa tiêu chí (danh mục, khoảng giá, thuộc tính như màu sắc/kích thước, đánh giá) và các tùy chọn sắp xếp.
- **Chi tiết sản phẩm thông minh:** Hỗ trợ sản phẩm có nhiều biến thể (variants), tự động cập nhật hình ảnh, giá và SKU khi người dùng chọn tùy chọn.
- **Giỏ hàng và Thanh toán liền mạch:** Giỏ hàng thông minh, tự động gộp sản phẩm, áp dụng mã giảm giá và quy trình thanh toán đa phương thức (COD, Chuyển khoản, tích hợp PayPal Sandbox).
- **Quản lý tài khoản cá nhân:** Người dùng có thể đăng ký/đăng nhập (xác thực JWT), quản lý thông tin, sổ địa chỉ, xem lại lịch sử đơn hàng chi tiết và theo dõi đơn hàng (cho cả khách vãng lai).
- **Tương tác người dùng:** Hệ thống đánh giá sản phẩm (có ảnh) và danh sách yêu thích (wishlist).

#### 🚀 Giao diện Quản trị viên (Admin)

- **Bảng điều khiển (Dashboard) trực quan:** Cung cấp cái nhìn tổng quan về hoạt động kinh doanh với các biểu đồ (đường, cột, tròn) và thẻ thống kê về doanh thu, đơn hàng, khách hàng mới. Dữ liệu có thể được lọc theo các khoảng thời gian tùy chọn (tuần, tháng, quý, năm).
- **Báo cáo & Phân tích chuyên sâu:** Các báo cáo chi tiết về Bán hàng, Sản phẩm (top bán chạy theo số lượng/doanh thu), Khách hàng (top chi tiêu) và Tồn kho (sản phẩm sắp hết/hết hàng).
- **Quản lý Sản phẩm (CRUD):** Giao diện thêm/sửa/xóa sản phẩm với trình soạn thảo văn bản (CKEditor), quản lý thuộc tính, tạo biến thể hàng loạt và tự động tạo SKU.
- **Quản lý Đơn hàng:** Xem danh sách đơn hàng với bộ lọc, xem chi tiết, cập nhật trạng thái, xử lý yêu cầu hủy/hoàn tiền từ khách hàng, và thực hiện hoàn tiền (refund) qua PayPal.
- **Quản lý Người dùng:** Xem danh sách khách hàng, thông tin chi tiết (tổng chi tiêu, số đơn hàng), và chức năng đình chỉ/kích hoạt tài khoản.
- **Hệ thống Khuyến mãi:** Tạo và quản lý mã giảm giá (coupon) với nhiều điều kiện phức tạp (theo %, số tiền cố định, đơn hàng tối thiểu, áp dụng cho sản phẩm/danh mục cụ thể).
- **Quản lý Nội dung & Cài đặt:** Cho phép admin tùy chỉnh các banner trên trang chủ, cài đặt ngôn ngữ/tiền tệ mặc định, và cấu hình số lượng item hiển thị trên các trang.

### 2. Cách tổ chức thư mục dự án

Dự án được tách thành hai phần riêng biệt: `frontend` và `backend`, với cấu trúc module hóa rõ ràng.

#### **Front-end (Next.js)**

- **`src/app/[locale]`**: Cấu trúc route động cốt lõi của **App Router**, là nơi chứa toàn bộ các trang và layout, xử lý đa ngôn ngữ một cách tự nhiên. Các route được nhóm theo chức năng (`(main)`, `admin`).
- **`src/components`**: Chứa các component React có thể tái sử dụng, được phân chia thành `client`, `admin`, và `shared` (dùng chung).
- **`src/constants`**: Chứa các định nghĩa biến.
- **`src/lib`**: Chứa các logic cốt lõi như axiosInstance (để gọi API), react-query (quản lý state phía server).
- **`src/lib/react-query`**: Chứa các custom hook (`useQuery`, `useMutation`) của **TanStack Query**, đóng gói logic fetch và quản lý state từ server.
- **`src/services`**: Tầng giao tiếp API, chứa các hàm gọi API cụ thể bằng **Axios**.
- **`src/store`**: Chứa các slice của **Redux Toolkit** để quản lý state toàn cục phía client (trạng thái xác thực, giỏ hàng checkout, cài đặt giao diện).
- **`src/types`**: Chứa các `interface` **TypeScript** định nghĩa cấu trúc dữ liệu cho toàn bộ dự án.
- **`src/i18n` & `src/middleware.ts`**: Chứa các file cấu hình và điều hướng cho thư viện **next-intl**.

#### **Back-end (Node.js/Express)**

- Sử dụng mô hình kiến trúc **MVC (Model-View-Controller)**.
- **`src/models`**: Định nghĩa các **Schema** của **Mongoose** với cấu trúc đa ngôn ngữ.
- **`src/controllers`**: Chứa toàn bộ logic nghiệp vụ, xử lý request và tương tác với Model. Sử dụng mạnh mẽ **Aggregation Pipeline** của MongoDB để tổng hợp dữ liệu phức tạp.
- **`src/routes`**: Định nghĩa các endpoint API theo chuẩn RESTful.
- **`src/middlewares`**: Chứa các hàm trung gian như xác thực token JWT, kiểm tra quyền admin, xác thực dữ liệu đầu vào bằng **Joi**, và xử lý ngôn ngữ.
- **`src/utils`**: Chứa các hàm tiện ích dùng chung như gửi email, xử lý upload, tạo token, v.v.
- **`src/validations`**: Chứa các phương thức validate cho các dữ liệu của các API.
- **`src/config`**: Chứa config cho MongoDB và Cloudinary.

### 3. Luồng thực thi của dự án

1. **Khởi động:** Hai server (Next.js và Express) chạy độc lập.
2. **API Call:** Giao diện frontend thực hiện các lời gọi API đến backend.
3. **Xử lý Backend:** Một request API sẽ chạy qua luồng: **Routes** → **Middlewares** (xác thực, validation, ngôn ngữ) → **Controllers** (logic nghiệp vụ) → **Models** (tương tác CSDL MongoDB).
4. **Hiển thị:** Frontend nhận response, cập nhật state, và re-render giao diện.

---

## ⚙️ Technology

Dự án được xây dựng trên nền tảng MERN stack đã được tùy chỉnh và mở rộng với các công nghệ hiện đại, tập trung vào hiệu suất, khả năng mở rộng và trải nghiệm người dùng.

### Front-end

- [**React 19**](https://react.dev/) & [**Next.js 15**](https://nextjs.org/) (App Router & Turbopack)
- [**TypeScript**](https://www.typescriptlang.org/)
- [**Tailwind CSS v4**](https://tailwindcss.com/)
- **State Management:**
  - [**TanStack Query (React Query) v5**](https://tanstack.com/query/latest)
  - [**Redux Toolkit**](https://redux-toolkit.js.org/)
- **UI Components:**
  - [**Headless UI**](https://headlessui.com/) (cho Client)
  - [**CoreUI for React v5**](https://coreui.io/react/) (cho Admin)
- **Charting:**
  - [**Chart.js v4**](https://www.chartjs.org/)
  - [**react-chartjs-2 v5**](https://react-chartjs-2.js.org/)
- **Internationalization (i18n):**
  - [**next-intl**](https://next-intl.dev/)
- **Rich Text Editor:**
  - [**CKEditor 5**](https://ckeditor.com/ckeditor-5/)
- **Payments:**
  - [**@paypal/react-paypal-js**](https://www.npmjs.com/package/@paypal/react-paypal-js)
- **HTTP Client:**
  - [**Axios**](https://axios-http.com/)
- **Utilities:**
  - [**Swiper.js**](https://swiperjs.com/) (Slider/Carousel)
  - [**date-fns**](https://date-fns.org/) (Thao tác ngày tháng)
  - [**react-hot-toast**](https://react-hot-toast.com/) (Thông báo)
  - [**react-icons**](https://react-icons.github.io/react-icons/) (Bộ icon)
  - [**classnames**](https://github.com/JedWatson/classnames) (Nối class động)
- **Real-time:**
  - [**Socket.IO Client**](https://socket.io/)

### Back-end

- **Runtime:**
  - [**Node.js**](https://nodejs.org/)
- **Framework:**
  - [**Express.js v5**](https://expressjs.com/)
- **Database ODM:**
  - [**Mongoose v8**](https://mongoosejs.com/)
- **Authentication:**
  - [**JSON Web Token (JWT)**](https://jwt.io/)
  - [**bcrypt**](https://www.npmjs.com/package/bcrypt)
- **Validation:**
  - [**Joi v17**](https://joi.dev/)
- **File Uploads:**
  - [**Multer**](https://github.com/expressjs/multer)
  - [**Cloudinary v2**](https://cloudinary.com/)
- **Utilities:**
  - [**Nodemailer**](https://nodemailer.com/) (Gửi email)
  - [**Winston**](https://github.com/winstonjs/winston) (Logging)
  - [**Socket.IO**](https://socket.io/) (Real-time Communication)
  - [**slugify**](https://www.npmjs.com/package/slugify) (Tạo URL thân thiện)
- **Development:**
  - [**Nodemon**](https://nodemon.io/)
- **Testing:**
  - [**Jest**](https://jestjs.io/)
  - [**Supertest**](https://www.npmjs.com/package/supertest)

### Database

- **NoSQL:** [**MongoDB**](https://www.mongodb.com/)

## 💻 Code Explanation

Phần này sẽ đi sâu vào chi tiết kiến trúc và logic của từng phần trong dự án.

### 1. Front-end

Frontend được xây dựng bằng **Next.js 15** theo kiến trúc **App Router**, **TypeScript**, **CoreUI** và **Tailwind CSS**, tạo ra một ứng dụng web hiện đại, hiệu suất cao và có khả năng mở rộng. Kiến trúc được thiết kế để tách biệt rõ ràng các mối quan tâm (separation of concerns) và tối ưu hóa trải nghiệm cho cả người dùng cuối và nhà phát triển.

#### `src/app` - Kiến trúc Route và Đa ngôn ngữ (i18n)

Kiến trúc thư mục `app` là trái tim của ứng dụng, tận dụng tối đa các tính năng của App Router.

- **App Router & Route động `[locale]`:** Toàn bộ ứng dụng được lồng trong thư mục `app/[locale]`. Đây là nền tảng cho hệ thống đa ngôn ngữ bằng `next-intl`. Middleware sẽ chặn các request, xác định `locale` ('vi' hoặc 'en') và chuyển nó vào `params` cho `layout.tsx` và `page.tsx`.
- **Route Groups `(main)` & `(admin)`:** Các route được nhóm bằng dấu ngoặc đơn để tổ chức code và áp dụng các layout khác nhau mà không ảnh hưởng đến URL cuối cùng.
  - `(main)`: Chứa tất cả các trang dành cho khách hàng (`/products`, `/cart`, `/profile`,...). Nó sử dụng `(main)/layout.tsx` để hiển thị Header, Footer và các thành phần chung của trang client.
  - `admin`: Chứa toàn bộ giao diện quản trị, sử dụng `admin/layout.tsx` riêng biệt với Sidebar và Header của admin.
- **Server & Client Components:**
  - **Server Components (`page.tsx`, `layout.tsx`):** Được ưu tiên sử dụng để tối ưu SEO và tốc độ tải trang ban đầu. Chúng có thể `async` để fetch dữ liệu trực tiếp trên server, giảm thiểu số lần gọi API từ client.
  - **Client Components (`"use client"`):** Được sử dụng cho các trang/component có tính tương tác cao (sử dụng `useState`, `useEffect`, và các event handler). Ví dụ, `ProductsPageClient.tsx` quản lý toàn bộ logic lọc và phân trang, trong khi `page.tsx` cha chỉ đơn giản là render nó.
- **Providers & Context:**
  - **`QueryProvider.tsx`, `SettingsContext.tsx`:** Các provider này được đặt ở gốc thư mục `app` và render bên trong `[locale]/layout.tsx`, đảm bảo toàn bộ ứng dụng client-side được bọc trong các context cần thiết.
  - **`AuthInitializerWrapper.tsx`:** Một wrapper quan trọng, sử dụng hook `useAuthInitializer` để xác thực phiên đăng nhập của người dùng (thông qua refresh token) trước khi render toàn bộ giao diện. Nó hiển thị một màn hình loading toàn cục, ngăn chặn hiện tượng "nhấp nháy" giao diện.

#### `src/components` - Thư viện Component Tái sử dụng

Đây là nơi chứa toàn bộ các "viên gạch" xây dựng nên giao diện, được tổ chức thành ba cấp để tối đa hóa khả năng tái sử dụng và dễ dàng quản lý.

- **`shared`**: Chứa các component chung nhất, có thể được sử dụng ở cả trang client và admin. Chúng thường là các thành phần UI cơ bản hoặc các tiện ích không phụ thuộc vào ngữ cảnh cụ thể.
  - Ví dụ: `ConfirmationModal.tsx` (modal xác nhận hành động), `RatingStars.tsx` (hiển thị sao đánh giá), `CustomEditor.tsx` (trình soạn thảo CKEditor), `SettingsSwitcher.tsx` (bộ chuyển đổi ngôn ngữ/tiền tệ).
- **`client`**: Chứa các component dành riêng cho giao diện khách hàng, thường có logic và giao diện phức tạp hơn, liên quan trực tiếp đến trải nghiệm mua sắm.
  - Ví dụ: `HeroBanner.tsx` (slider trang chủ), `ProductCard.tsx` (thẻ sản phẩm), `CheckoutForm.tsx` (form thanh toán), `CategoryMenu.tsx` (mega menu).
- **`admin`**: Chứa các component dành riêng cho trang quản trị, được xây dựng chủ yếu bằng **CoreUI for React** để tạo ra giao diện dashboard chuyên nghiệp.
  - Ví dụ: `AdminSidebar.tsx`, `DataTablePagination.tsx`, các component bảng (`ProductTable`, `OrderTable`), và các component form trong modal (`CouponForm`, `AttributeValueFormModal`).

#### `src/types`

Đây là "nguồn sự thật" về cấu trúc dữ liệu của toàn bộ ứng dụng.

- **Định nghĩa Type:** Sử dụng **TypeScript `interface` và `type`** để định nghĩa cấu trúc cho mọi đối tượng dữ liệu, từ các model database (`Product`, `Order`, `User`) đến các payload API (`OrderCreationPayload`) và response (`PaginatedProductsResponse`).
- **Tách biệt Client & Admin:** Đối với các model có cấu trúc đa ngôn ngữ, các type được tách biệt rõ ràng:
  - `ProductAdmin`, `CategoryAdmin`: Đại diện cho dữ liệu gốc từ database với các trường đa ngôn ngữ (`name: { vi, en }`). Được sử dụng trong các form admin.
  - `Product`, `Category`: Đại diện cho dữ liệu đã được "làm phẳng" (`name: string`). Được sử dụng trên toàn bộ trang client và trong các bảng hiển thị của admin.
- **`I18nField`:** Một type dùng chung `{ vi: string; en: string; }` được định nghĩa để đảm bảo tính nhất quán cho tất cả các trường đa ngôn ngữ.

#### `src/constants`

Thư mục này chứa các giá trị không đổi, được sử dụng ở nhiều nơi trong ứng dụng để đảm bảo tính nhất quán và dễ dàng thay đổi khi cần.

- **`filters.ts`**: Định nghĩa các khoảng giá được xác định trước cho bộ lọc sản phẩm.
- **`orderConstants.ts`**: Chứa mảng các trạng thái đơn hàng, bao gồm `value` (dùng trong logic) và `label`/`color` (dùng cho hiển thị badge).

#### `src/lib` - Tầng Logic & Quản lý State

Đây là nơi chứa các logic cốt lõi, không phụ thuộc trực tiếp vào giao diện.

- **`lib/react-query` (TanStack Query):** "Bộ não" của việc quản lý dữ liệu từ server.
  - **Custom Hooks:** Mỗi resource API có một file query riêng (`productQueries.tsx`). Các hook như `useGetProducts`, `useCreateProduct` đóng gói hoàn toàn logic gọi API, caching, và invalidation.
  - **Quản lý Cache:** Sử dụng `queryKey` có cấu trúc để quản lý cache hiệu quả, tự động cập nhật giao diện khi dữ liệu thay đổi ở backend.
- **`lib/axiosInstance.ts`**: Cấu hình một instance Axios duy nhất.
  - **Interceptors:** Sử dụng `interceptors` để tự động đính kèm **JWT Access Token** và header `Accept-Language`, cũng như xử lý logic làm mới token và tự động logout.
- **`lib/utils.ts`**: Chứa các hàm tiện ích thuần túy như `formatCurrency` (hỗ trợ đa tiền tệ), `getLocalizedName` (xử lý dữ liệu đa ngôn ngữ), `timeAgo`, v.v.

#### `src/services`

Tầng này là cầu nối trực tiếp giữa ứng dụng và các endpoint API của backend.

- **Tách biệt:** Mỗi file service (`productService.ts`, `orderService.ts`) tương ứng với một controller ở backend.
- **Type-safe:** Các hàm được định nghĩa type chặt chẽ bằng **TypeScript**, nhận vào payload và trả về response với các `interface` đã được định nghĩa trong `src/types`.

#### `src/store` (Redux Toolkit)

Quản lý các state toàn cục phía client.

- **`authSlice`**: Lưu trữ thông tin user, `accessToken`, và trạng thái `isAuthenticated`.
- **`checkoutSlice`**: Lưu ID của các sản phẩm được chọn từ giỏ hàng để mang sang trang thanh toán.
- **`breadcrumbSlice`**: Giải pháp sử dụng Redux để các trang con có thể gửi dữ liệu động (như tên sản phẩm) ngược lên cho component `AdminBreadcrumb` ở layout cha.

#### `src/i18n` & `src/middleware.ts`

- **`next-intl`:** Thư viện được chọn để triển khai i18n.
- **`messages/*.json`:** Chứa các chuỗi dịch tĩnh cho giao diện.
- **`middleware.ts`:**
  - Xử lý định tuyến ngôn ngữ. Nó ưu tiên **cookie của người dùng**, sau đó mới đến **cài đặt mặc định của admin** (lấy qua API call).
  - Tự động chuyển hướng đến URL có tiền tố ngôn ngữ (ví dụ: `/vi` hoặc `/en`).
- **`navigation.ts`:** Tạo ra các phiên bản "bản địa hóa" của `useRouter`, `usePathname` và `Link`.

### 2. Back-end

Backend được xây dựng theo kiến trúc **MVC (Model-View-Controller)** mở rộng, tập trung vào tính module hóa, khả năng bảo trì và xử lý bất đồng bộ hiệu quả.

#### Config (`src/config`)

- **`db.js`**: Quản lý việc kết nối đến **MongoDB** bằng Mongoose. Nó đọc chuỗi kết nối từ biến môi trường `MONGODB_URI` và xử lý lỗi một cách an toàn, đảm bảo ứng dụng sẽ thoát nếu không kết nối được database.
- **`cloudinary.js`**: Cấu hình SDK của **Cloudinary** với các thông tin xác thực từ biến môi trường, sẵn sàng cho việc upload file.

#### Models (`src/models`)

Đây là tầng dữ liệu, định nghĩa cấu trúc cho các collection trong MongoDB bằng **Mongoose ODM**. Mỗi file trong thư mục này tương ứng với một collection.

- **Kiến trúc Đa ngôn ngữ (i18n):** Các trường văn bản cần dịch (như `name`, `description`) sử dụng một `i18nStringSchema` chung, lưu dữ liệu dưới dạng object `{ vi: '...', en: '...' }`.
- **Dữ liệu Nhúng & Tham chiếu:** Kết hợp linh hoạt giữa việc nhúng dữ liệu (Embedding) cho các thông tin có quan hệ chặt chẽ (ví dụ: `Product.variants`, `Order.orderItems`) và tham chiếu (Referencing) qua `ObjectId` và `ref` cho các mối quan hệ logic (`Product` -> `Category`, `Order` -> `User`).
- **Tự động hóa:** Sử dụng các hook `pre('save')` của Mongoose để tự động hóa các tác vụ như tạo `slug`.

**Các Model chính:**

- `User`: Lưu thông tin khách hàng và admin, bao gồm cả trạng thái `isActive`.
- `Product`: Lưu thông tin sản phẩm, bao gồm các biến thể (variants) và thuộc tính (attributes) đa ngôn ngữ.
- `Category`: Lưu danh mục sản phẩm với cấu trúc cha-con đệ quy.
- `Order`: Lưu "snapshot" đa ngôn ngữ của một đơn hàng tại thời điểm mua, đảm bảo tính toàn vẹn lịch sử.
- `Attribute`, `Coupon`, `Review`, `Setting`, `Cart`, `Wishlist`, `Notification`.

#### Validations (`src/validations`)

- **Nền tảng:** Sử dụng thư viện **Joi** để định nghĩa các schema xác thực cho dữ liệu đầu vào.
- **Validation chi tiết:** Mỗi schema định nghĩa các quy tắc chặt chẽ cho từng trường: kiểu dữ liệu, độ dài, định dạng (regex), và các thông báo lỗi tùy chỉnh bằng Tiếng Việt.
- **Xử lý Đa ngôn ngữ:** Schema `i18nStringSchema` của Joi được tạo ra để xác thực các object `{ vi, en }`, đảm bảo dữ liệu đa ngôn ngữ đầu vào luôn hợp lệ.
- **Logic Phụ thuộc:** Sử dụng các phương thức nâng cao như `.when()` và `.xor()` để xử lý các logic validation phức tạp.

#### Controllers (`src/controllers`)

Đây là "bộ não" chứa toàn bộ logic nghiệp vụ. Mỗi controller quản lý một resource cụ thể (ví dụ: `productController`, `orderController`).

- **Xử lý Bất đồng bộ:** Mọi hàm controller đều là `async` và được bọc trong `asyncHandler` để tự động bắt lỗi và chuyển đến `errorHandler`.
- **Logic "Làm phẳng" (Flattening):** Controllers chịu trách nhiệm "làm phẳng" dữ liệu đa ngôn ngữ. Dựa vào `req.locale`, chúng sẽ chọn đúng chuỗi ngôn ngữ (`.vi` hoặc `.en`), giúp cho frontend client nhận được dữ liệu sẵn sàng để hiển thị. Các API dành riêng cho admin sẽ trả về dữ liệu gốc.
- **Aggregation Pipeline:** Sử dụng mạnh mẽ **Aggregation Pipeline** của MongoDB để thực hiện các phép tính toán và tổng hợp dữ liệu phức tạp (tính doanh thu, báo cáo, lọc nâng cao).

**Luồng xử lý trong mỗi hàm Controller:**

1. **Thu thập dữ liệu đầu vào:** Lấy dữ liệu từ `req.params`, `req.query`, `req.body`, `req.user` (đã được middleware xác thực) và `req.locale`.
2. **Tương tác với Model:** Gọi các phương thức của Mongoose (`.find()`, `.findById()`, `.aggregate()`, `.save()`) để thao tác với database.
3. **Xử lý logic nghiệp vụ:** Thực hiện các phép tính, kiểm tra điều kiện, và gọi các hàm tiện ích (`utils`) nếu cần (ví dụ: gửi email, tạo thông báo).
4. **Gửi Response:** Trả về response cho client với status code và dữ liệu JSON phù hợp.

**Các Status Code Response phổ biến:**

- `200 OK`: Cho các request `GET` hoặc `PUT`/`PATCH` thành công.
- `201 Created`: Cho request `POST` tạo mới một tài nguyên thành công.
- `204 No Content`: Cho request `DELETE` thành công (không trả về body).
- `400 Bad Request`: Dữ liệu đầu vào không hợp lệ (lỗi từ Joi validation).
- `401 Unauthorized`: Lỗi xác thực (thiếu token, token sai/hết hạn).
- `403 Forbidden`: Đã xác thực nhưng không có quyền truy cập (ví dụ: user thường cố truy cập route admin, hoặc tài khoản bị đình chỉ).
- `404 Not Found`: Không tìm thấy tài nguyên được yêu cầu.
- `500 Internal Server Error`: Lỗi không xác định từ phía server.

#### Middlewares (`src/middlewares`)

- **`asyncHandler.js`:** Một wrapper giúp bắt các lỗi trong các hàm `async` và chuyển chúng đến `errorHandler` một cách tự động.
- **`authMiddleware.js`:**
  - `protect`: Bảo vệ route, giải mã **JWT**, tìm người dùng, và kiểm tra trạng thái `isActive` trên **mọi request**.
  - `protectOptional`: Cố gắng xác thực người dùng nhưng không báo lỗi nếu thiếu token.
- **`localeMiddleware.js`:** Đọc header `Accept-Language` và gắn `req.locale`, làm cơ sở cho logic đa ngôn ngữ.
- **`identifyCartUser.js` & `identifyWishlistUser.js`:** Các middleware thông minh xác định định danh cho giỏ hàng/wishlist (ưu tiên `userId`, fallback về `guestId` trong cookie).
- **`validationMiddleware.js`:** Sử dụng các schema từ `validations` để kiểm tra `req.body`.
- **`errorMiddleware.js`:** `notFound` (xử lý lỗi 404) và `errorHandler` (bắt tất cả các lỗi khác).

#### Routes (`src/routes`)

Định nghĩa các endpoint API theo chuẩn RESTful, là cổng giao tiếp giữa frontend và controllers.

- **Cấu trúc:** Sử dụng `express.Router()` để nhóm các endpoint theo từng resource (ví dụ: `productRoutes.js`, `orderRoutes.js`).
- **Phương thức HTTP:** Sử dụng đúng các phương thức `GET`, `POST`, `PUT`, `DELETE` cho các hành động CRUD tương ứng.
- **Gắn Middlewares:** Các route được gắn với các middleware theo đúng thứ tự logic:
  `router.post('/', protect, isAdmin, validateRequest(schema), controllerFunction);`
- **Tách biệt Admin/Client:** Một số route có các endpoint `/admin` riêng biệt để trả về dữ liệu gốc, đa ngôn ngữ, phục vụ cho việc chỉnh sửa, trong khi các endpoint công khai trả về dữ liệu đã được làm phẳng.

**Các API Endpoint chính:**

| Phương thức                 | Endpoint                     | Chức năng                                             |
| :-------------------------- | :--------------------------- | :---------------------------------------------------- |
| **Authentication**          |                              |                                                       |
| `POST`                      | `/api/v1/auth/register`      | Đăng ký tài khoản mới.                                |
| `POST`                      | `/api/v1/auth/login`         | Đăng nhập và nhận Access Token.                       |
| `POST`                      | `/api/v1/auth/refresh`       | Làm mới Access Token bằng Refresh Token.              |
| `POST`                      | `/api/v1/auth/logout`        | Đăng xuất.                                            |
| **Products**                |                              |                                                       |
| `GET`                       | `/api/v1/products`           | Lấy danh sách sản phẩm (có filter, sort, pagination). |
| `GET`                       | `/api/v1/products/:idOrSlug` | Lấy chi tiết một sản phẩm.                            |
| `POST`                      | `/api/v1/products`           | **[Admin]** Tạo sản phẩm mới.                         |
| `PUT`                       | `/api/v1/products/:id`       | **[Admin]** Cập nhật sản phẩm.                        |
| **Orders**                  |                              |                                                       |
| `GET`                       | `/api/v1/orders/my`          | **[User]** Lấy lịch sử đơn hàng.                      |
| `POST`                      | `/api/v1/orders`             | Tạo đơn hàng mới từ giỏ hàng.                         |
| `GET`                       | `/api/v1/orders`             | **[Admin]** Lấy tất cả đơn hàng.                      |
| `PUT`                       | `/api/v1/orders/:id/status`  | **[Admin]** Cập nhật trạng thái đơn hàng.             |
| `POST`                      | `/api/v1/orders/:id/restock` | **[Admin]** Khôi phục tồn kho cho đơn hàng đã hủy.    |
| **Dashboard & Reports**     |                              |                                                       |
| `GET`                       | `/api/v1/dashboard/stats`    | **[Admin]** Lấy các số liệu tổng quan cho dashboard.  |
| `GET`                       | `/api/v1/reports/sales`      | **[Admin]** Lấy báo cáo chi tiết về bán hàng.         |
| **Và nhiều endpoints khác** |                              | Cho `Users`, `Categories`, `Coupons`, `Reviews`,...   |

#### Utils (`src/utils`)

- **`generateToken.js`:** Logic tạo Access & Refresh Token bằng JWT.
- **`sendEmail.js`:** Tích hợp **Nodemailer** để gửi email giao dịch.
- **`paypalClient.js`:** Đóng gói toàn bộ logic giao tiếp với **PayPal API**, bao gồm cả việc lấy tỷ giá tự động từ **ExchangeRate-API**.
- **`cartUtils.js` & `wishlistUtils.js`:** Chứa logic nghiệp vụ phức tạp như tự động gộp giỏ hàng/wishlist của khách sau khi họ đăng nhập.
- **`notificationUtils.js`:** Tích hợp với **Socket.IO** để "phát" (`emit`) các thông báo real-time đến admin.
- **`logger.js`:** Cấu hình **Winston** để tạo hệ thống logging mạnh mẽ.

#### App & Server (`src/app & src/server`)

- **Khởi tạo & Lắp ráp:** `app.js` chịu trách nhiệm tạo instance của Express, cấu hình các middleware toàn cục như `cors`, `cookieParser`, `httpLoggerMiddleware`, `setLocale`, và sau đó "lắp ráp" tất cả các file routes vào các đường dẫn tương ứng. Nó cũng định nghĩa middleware xử lý lỗi cuối cùng.
- **Khởi chạy Server:** `server.js` là file thực thi chính. Nó import `app` từ `app.js`, thực hiện kết nối đến database (`connectDB`), tạo một server HTTP, và quan trọng nhất là tích hợp **Socket.IO** vào server HTTP đó bằng cách gọi `initSocket(httpServer)`.

#### Socket.IO (`src/socket.js`)

- **Kiến trúc Real-time:** File này quản lý toàn bộ logic giao tiếp thời gian thực.
- **Xác thực Admin:** Socket.IO có một middleware (`io.use`) riêng để xác thực các kết nối từ client admin. Nó yêu cầu client gửi JWT qua `socket.handshake.auth.token`, giải mã token, và kiểm tra vai trò `admin` trước khi cho phép kết nối.
- **Quản lý kết nối:** Sử dụng một `Map` (`adminSockets`) để theo dõi các admin đang online (ánh xạ `userId` -> `socket.id`).
- **Phát sự kiện:** Cung cấp một hàm `emitToAdmins` có thể được gọi từ bất kỳ đâu trong ứng dụng (ví dụ: từ `notificationUtils`) để gửi sự kiện đến một hoặc tất cả các admin đang kết nối, tạo ra các thông báo real-time.
