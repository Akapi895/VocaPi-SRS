# Chrome Extension Test Instructions

## Lỗi đã được sửa:

1. **Cải thiện Error Handling**: Thêm validation chi tiết cho các tham số và SRS data
2. **Fallback Algorithm**: Thêm thuật toán fallback khi advanced SRS gặp lỗi
3. **Data Normalization**: Đảm bảo tất cả dữ liệu SRS có format đúng
4. **Detailed Logging**: Thêm console.log chi tiết để debug

## Để test extension:

1. Mở Chrome và đi đến `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked" và chọn thư mục vocab-srs-extension
4. Mở extension popup
5. Thêm một từ mới để test
6. Bắt đầu review và test các nút Correct, Easy, Perfect

## Debug trong Chrome:

1. Nhấn F12 để mở Developer Tools
2. Vào tab Console
3. Khi click các quality buttons, sẽ thấy logs chi tiết:
   - "Submitting quality: X for word: [word]"
   - "Current SRS data: [object]"
   - "Updated SRS data: [object]"
   - "Successfully saved word update"

## Nếu vẫn còn lỗi:

- Check console logs để xem error cụ thể
- Các fallback mechanisms sẽ tự động kick in
- Error messages giờ sẽ hiện thông tin chi tiết hơn

## Test Cases:

1. **Test với từ mới**: Thêm từ mới và review với quality 3,4,5
2. **Test với từ cũ**: Review từ đã có với quality khác nhau
3. **Test error handling**: Force lỗi bằng cách corrupt data trong storage
4. **Test fallback**: Tắt advanced SRS và test với basic algorithm

## Files đã được sửa:

- `src/ui/popup.js`: Enhanced submitQuality function
- `src/ui/review.js`: Enhanced submitQuality function
- `src/utils.js`: Enhanced SRSAlgorithm with fallback and normalization
