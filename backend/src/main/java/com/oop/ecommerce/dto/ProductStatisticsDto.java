package com.oop.ecommerce.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ProductStatisticsDto {
    private long totalProducts;
    private long totalItemsLeft;
    private long totalItemsSold;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private double revenueGrowthPercent;
    private double itemsSoldGrowthPercent;
    private List<MonthlyRevenuePointDto> monthlyRevenue = new ArrayList<>();
    private List<CategorySalesDto> salesByCategory = new ArrayList<>();
}
