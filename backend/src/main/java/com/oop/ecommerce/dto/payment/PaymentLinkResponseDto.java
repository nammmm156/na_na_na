package com.oop.ecommerce.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentLinkResponseDto {
    private Long orderId;
    private String checkoutUrl;
}
