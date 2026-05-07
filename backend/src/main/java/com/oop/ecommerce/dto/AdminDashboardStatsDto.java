package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Payload đầy đủ cho trang Admin Dashboard (chỉ đọc DB).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    /** Tổng doanh thu: SUM(total_amount) các đơn trạng thái PAID */
    private BigDecimal totalRevenue;
    private long totalProducts;
    private long itemsInStock;
    /** Tổng số lượng đã bán (SUM quantity dòng đơn, đơn PAID) */
    private long itemsSold;
    /** Chuỗi ngày liên tục (vd 7 ngày), ngày không có đơn = 0 */
    private List<DailyRevenuePointDto> dailyRevenue = new ArrayList<>();
    /** Tồn kho gộp theo size EU (tổng quantity trên mọi sản phẩm) */
    private List<ShoeSizeStockShareDto> stockByShoeSize = new ArrayList<>();
}
