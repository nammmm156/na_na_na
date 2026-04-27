package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductStatisticsDto {
    private long totalProducts;
    private long totalItemsLeft;
    private long totalItemsSold;
    private BigDecimal totalRevenue;
}
