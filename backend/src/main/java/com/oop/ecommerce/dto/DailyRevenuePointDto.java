package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một điểm doanh thu theo ngày (dùng cho biểu đồ Revenue Overview).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyRevenuePointDto {
    /** ISO-8601 ngày (YYYY-MM-DD), múi giờ đã được gom theo Asia/Ho_Chi_Minh */
    private String date;
    /** Nhãn hiển thị ngắn (vd: "5/5") */
    private String label;
    /** Doanh thu VND trong ngày (tổng total_amount đơn PAID) */
    private long revenueVnd;
}
