# 🐧 Nhà Hàng Penny

Game quản lý nhà hàng kiểu *Penguin Diner*, làm bằng **React + Vite**, vẽ bằng HTML5 Canvas.

## Chạy game

```bash
yarn          # cài thư viện (lần đầu)
yarn dev      # chạy thử, mở http://localhost:5173
yarn build    # đóng gói ra thư mục dist/
yarn preview  # xem bản đã đóng gói
```

### Chơi trên điện thoại
Chạy `yarn dev` trên máy tính, rồi mở địa chỉ **Network** mà Vite in ra (ví dụ `http://192.168.1.5:5173`)
bằng trình duyệt điện thoại **cùng mạng Wi-Fi**. Cầm dọc hay xoay ngang đều chơi được (mỗi hướng có bố cục riêng); nút ⛶ để bật toàn màn hình.

### Lưu tiến trình lên Firestore (tuỳ chọn)
Không cần đăng nhập: người chơi nhập **username** ở màn hình bắt đầu, tiến trình được lưu vào
document `{username}/progress` (và vẫn lưu localStorage như cũ). Username được nhớ trên máy,
nhập cùng username ở máy khác để chơi tiếp.

1. Tạo project trên [Firebase Console](https://console.firebase.google.com), bật **Firestore Database**, thêm một **Web app**.
2. `cp .env.example .env` rồi điền cấu hình của Web app.
3. Dán nội dung `firestore.rules` vào tab **Rules** của Firestore rồi bấm Publish.
4. Tạo username bằng tay: **Start collection** → Collection ID = username (vd `dinhdinh`) →
   Document ID = `progress` → thêm một field bất kỳ rồi Save. Game không tự tạo username mới.
5. Deploy GitHub Pages: thêm các secret `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` trong *Settings → Secrets and variables → Actions*.

## Cách chơi
1. Kéo khách đang chờ bên trái vào bàn trống.
2. Khách hiện ❗ → bấm vào bàn để ghi món.
3. Bấm bảng **ĐƠN** để đưa đơn cho đầu bếp.
4. Món xong nằm trên quầy → bấm để bưng, rồi bấm bàn có số trùng.
5. Khách hiện 💰 → bấm bàn để tính tiền.

Có thể bấm liên tiếp nhiều chỗ, Penny sẽ làm lần lượt. Khách càng nhiều ♥ thì tip càng cao.
Penny bưng được **2 món cùng lúc** (2 tay), nâng cấp Khay lớn để bưng món thứ 3.

### Lịch mở khoá theo ngày
| Ngày | Bàn | Lượt khách | Món mới |
|---|---|---|---|
| 1 | 3 | 6 | 🐟 Cá nướng, 🍣 Sushi, 🧋 Trà sữa |
| 2 | 4 | 9 | 🍜 Mì ramen, 🍙 Cơm nắm cá hồi |
| 3 | 4 | 11 | 🍦 Kem tuyết, 🍮 Bánh flan |
| 4 | 5 | 13 | 🍤 Tôm tempura, 🍵 Trà xanh matcha |
| 5 | 5 | 15 | 🍲 Lẩu hải sản, 🥟 Há cảo tôm |
| 6 | 6 | 17 | 🍰 Bánh kem dâu, 🥥 Nước dừa |
| 7 | 6 | 19 | 🦀 Cua hấp, 🍧 Bingsu |
| 8 | 7 | 21 | 🍛 Cà ri cá |
| 9 | 7 | 23 | 🍡 Bánh dango |
| 10+ | 8 | 25 (+2 mỗi ngày) | — |

### Shop
- **Thuốc** (dùng trong ngày, bấm nút dưới màn hình hoặc phím 1/2/3):
  ⚡ Chạy nhanh (x2 tốc độ, 20s) · 🔥 Nấu nhanh (x3, 20s) · 💖 Vui vẻ (đầy lại ♥ cho mọi khách)
- **Nâng cấp** (vĩnh viễn): giày trượt băng, bếp xịn, khay lớn, trang trí.

Nhạc nền lo-fi chill (tự soạn, phát bằng Web Audio), bật/tắt bằng nút 🎵 trên thanh trên cùng.

Cuối ngày dùng tiền để nâng cấp. Tiến trình được lưu tự động trong trình duyệt. `Esc` để tạm dừng.

## Cấu trúc
```
src/
  main.jsx               điểm khởi động React
  App.jsx                quản lý màn hình (menu / chơi / tạm dừng / cuối ngày), lưu game
  App.css
  components/
    GameCanvas.jsx       canvas + vòng lặp requestAnimationFrame + chuột/cảm ứng
    Hud.jsx              thanh thông tin trên cùng
    Screens.jsx          màn hình bắt đầu, tạm dừng, tổng kết + cửa hàng
  game/
    data.js              món ăn, loại khách, nâng cấp, toạ độ
    engine.js            logic game (khách, Penny, bếp, điều khiển)
    render.js            vẽ mọi thứ lên canvas
    save.js              lưu/đọc localStorage
    audio.js             hiệu ứng âm thanh (Web Audio)
```
