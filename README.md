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
bằng trình duyệt điện thoại **cùng mạng Wi-Fi**. Nên xoay ngang máy; nút ⛶ để bật toàn màn hình.

## Cách chơi
1. Kéo khách đang chờ bên trái vào bàn trống.
2. Khách hiện ❗ → bấm vào bàn để ghi món.
3. Bấm bảng **ĐƠN** để đưa đơn cho đầu bếp.
4. Món xong nằm trên quầy → bấm để bưng, rồi bấm bàn có số trùng.
5. Khách hiện 💰 → bấm bàn để tính tiền.

Có thể bấm liên tiếp nhiều chỗ, Penny sẽ làm lần lượt. Khách càng nhiều ♥ thì tip càng cao.
Thực đơn có món ăn, đồ uống và tráng miệng, mở dần theo ngày:
ngày 1 🐟 🍣 🧋 · ngày 2 🍜 🍙 · ngày 3 🍦 🍮 · ngày 4 🍤 · ngày 5 🍲.

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
