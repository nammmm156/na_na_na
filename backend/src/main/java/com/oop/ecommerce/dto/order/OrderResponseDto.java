package com.oop.ecommerce.dto.order;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrderResponseDto {
    private Long id;
    private String status;
    private Long subtotalAmount;
    private Long discountAmount;
    private Long totalAmount;
    private String paymentMethod;
    private String voucherCode;
    private String shipFullName;
    private String shipPhone;
    private String shipAddressLine;
    private String shipCity;
    private String note;
    private List<OrderLineResponseDto> lineItems;
}
