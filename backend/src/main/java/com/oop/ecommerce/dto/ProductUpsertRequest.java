package com.oop.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class ProductUpsertRequest {
    @NotBlank
    private String name;

    private String description;

    @Min(0)
    private BigDecimal price;

    private String category;

    private String imageUrl;

    /**
     * Key = EU shoe size (36..42), value = quantity for that size.
     * Missing sizes will be treated as 0.
     */
    private Map<Integer, Integer> sizeQuantities;
}

