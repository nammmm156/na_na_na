package com.oop.ecommerce.dto.order;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderPaymentStatusDto {
    private Long orderId;
    private String status;
    private Long totalAmount;
    private String paymentMethod;
}
