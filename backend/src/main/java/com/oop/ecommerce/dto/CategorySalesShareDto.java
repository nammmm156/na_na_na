package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Tỷ trọng doanh thu theo danh mục (tính trên dòng đơn: unit_price × quantity, đơn PAID).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategorySalesShareDto {
    private String category;
    /** Tổng tiền theo danh mục (VND) */
    private BigDecimal revenueVnd;
    /** Phần trăm so với tổng doanh thu các danh mục (0–100) */
    private double percent;
}
