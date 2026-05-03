package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryShareDto {
    private String category;
    /** Phần trăm 0–100 (làm tròn, tổng ≈ 100) */
    private int percent;
}
