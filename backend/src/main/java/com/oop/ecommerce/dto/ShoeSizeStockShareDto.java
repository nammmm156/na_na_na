package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregate on-hand units per EU shoe size (sum across all products).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShoeSizeStockShareDto {
    private int shoeSize;
    private long quantity;
    /** Share of total units in stock (0–100) */
    private double percent;
}
