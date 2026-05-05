package com.oop.ecommerce.dto.order;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Frontend line item includes shoeSize for per-size inventory. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateOrderItemDto {

    @NotNull
    private Long productId;

    @NotNull
    @Min(1)
    private Integer quantity;

    @NotNull
    @Min(35)
    @Max(45)
    private Integer shoeSize;
}
