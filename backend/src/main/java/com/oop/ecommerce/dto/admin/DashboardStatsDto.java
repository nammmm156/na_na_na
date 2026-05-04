package com.oop.ecommerce.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private Long totalRevenue;
    private Long totalProducts;
    private Long itemsInStock;
    private Long itemsSold;
    private List<DailyRevenuePointDto> dailyRevenue;
    private List<CategorySalesDto> salesByCategory;
}

