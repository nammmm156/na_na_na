package com.oop.ecommerce.dto.order;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Frontend có thể gửi thêm field (vd. shoeSize); không map vào DB thì bỏ qua để tránh lỗi parse. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateOrderItemDto {

    @NotNull
    private Long productId;

    @NotNull
    @Min(1)
    private Integer quantity;
}
