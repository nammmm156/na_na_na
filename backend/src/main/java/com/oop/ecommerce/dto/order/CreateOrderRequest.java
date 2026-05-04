package com.oop.ecommerce.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotEmpty
    @Valid
    private List<CreateOrderItemDto> items;

    @Valid
    @NotNull
    private CreateOrderAddressDto shippingAddress;

    /**
     * {@code COD} or {@code PAYOS_NAPAS247}
     */
    @NotBlank
    private String paymentMethod;

    private String note;

    /** Optional voucher code (must match storefront rules when not buy-now). */
    private String voucherCode;
}
