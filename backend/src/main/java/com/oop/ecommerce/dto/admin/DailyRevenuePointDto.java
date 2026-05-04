package com.oop.ecommerce.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyRevenuePointDto {
    /** ISO date yyyy-MM-dd */
    private String date;
    /** Doanh thu VND dạng số nguyên (đã làm tròn theo luật tính giá hiện tại). */
    private Long revenue;
}

