package com.oop.ecommerce.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategorySalesDto {
    private String category;
    /** Tổng số lượng bán (chỉ tính đơn PAID). */
    private Long quantity;
    /** Tỷ trọng % theo số lượng bán (0-100). */
    private Integer percent;
}

