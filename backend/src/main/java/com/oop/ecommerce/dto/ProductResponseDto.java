package com.oop.ecommerce.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
public class ProductResponseDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity; // total across all sizes
    private String category;
    private String imageUrl;
    private Integer soldQuantity;
    private Map<Integer, Integer> sizeQuantities;
}

