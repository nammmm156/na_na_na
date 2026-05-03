package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Điểm doanh thu theo kỳ. Hiện fill bằng phân bổ synthetic từ totalRevenue — sau có Order theo ngày thì
 * thay bằng aggregate thật từ DB.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenuePoint {
    private String label;
    private BigDecimal amount;
}
