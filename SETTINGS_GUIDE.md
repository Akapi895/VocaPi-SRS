# Cách sử dụng Cloud Sync & Backup

## Thiết lập Firebase Cloud Sync

### Bước 1: Truy cập Settings

1. Nhấn vào extension icon trên thanh toolbar
2. Chọn nút "⚙️ Settings" trong popup
3. Trang Settings sẽ mở ra trong tab mới

### Bước 2: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới hoặc chọn project có sẵn
3. Trong Project Settings, chọn tab "General"
4. Kéo xuống phần "Your apps" và nhấn "Add app"
5. Chọn Web app icon (< />)
6. Đặt tên app và nhấn "Register app"

### Bước 3: Lấy Firebase Configuration

Sau khi tạo app, Firebase sẽ hiển thị config object như này:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc...",
};
```

### Bước 4: Cấu hình trong Settings

1. Copy từng giá trị từ firebaseConfig vào các trường tương ứng trong Settings page
2. Nhấn "💾 Save Configuration"
3. Nhấn "🔄 Test Connection" để kiểm tra kết nối
4. Nếu thấy "✅ Firebase connection successful!" là đã thành công

### Bước 5: Thiết lập Firestore Database

1. Trong Firebase Console, chọn "Firestore Database"
2. Nhấn "Create database"
3. Chọn "Start in test mode" (hoặc production mode nếu bạn hiểu về security rules)
4. Chọn location gần nhất với bạn

### Bước 6: Thiết lập Authentication (Optional)

1. Trong Firebase Console, chọn "Authentication"
2. Chọn tab "Sign-in method"
3. Enable "Anonymous" authentication để cho phép sync mà không cần đăng ký

## Tính năng Settings Page

### ☁️ Cloud Sync Configuration

- **Firebase Setup**: Nhập thông tin Firebase project
- **Test Connection**: Kiểm tra kết nối Firebase
- **Clear Configuration**: Xóa cấu hình để dùng offline

### ⚙️ Sync Preferences

- **Auto Sync**: Tự động đồng bộ trong background
- **Sync Interval**: Tần suất kiểm tra sync (5 phút - 1 giờ)
- **Conflict Resolution**: Cách xử lý xung đột dữ liệu
- **Encryption**: Mã hóa dữ liệu trước khi upload
- **Compression**: Nén dữ liệu để tiết kiệm bandwidth

### 📊 Data Management

- **Export All Data**: Tải xuống toàn bộ dữ liệu dạng JSON
- **Import Data**: Tải lên dữ liệu từ file JSON
- **Reset Sync Data**: Xóa metadata sync để bắt đầu lại

## Bảo mật

### Environment Variables

- Không commit Firebase config vào git
- File `.env` đã được thêm vào `.gitignore`
- Sử dụng Chrome storage để lưu config locally

### Demo Mode

- Khi không có Firebase config, extension chạy ở demo mode
- Tất cả chức năng vẫn hoạt động, chỉ không có cloud sync
- Dữ liệu được lưu local trong Chrome storage

## Troubleshooting

### Lỗi kết nối Firebase

1. Kiểm tra lại API key và project ID
2. Đảm bảo Firestore Database đã được tạo
3. Kiểm tra internet connection

### Sync không hoạt động

1. Vào Settings > Test Connection
2. Kiểm tra Auto Sync có được bật không
3. Restart extension (disable/enable)

### Mất dữ liệu

1. Sử dụng chức năng Export để backup định kỳ
2. Dữ liệu local vẫn được giữ nguyên khi Firebase lỗi
3. Import lại từ file backup nếu cần

## Liên hệ Support

Nếu gặp vấn đề, vui lòng:

1. Check console log (F12 > Console)
2. Export dữ liệu trước khi thay đổi cấu hình
3. Screenshot lỗi để dễ debug
