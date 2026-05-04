package com.oop.ecommerce.dto.payment;

import lombok.Data;

/**
 * Optional body cho {@code POST /api/payment/confirm-webhook}.
 * Nếu bỏ trống và đã có {@code payos.webhook-public-url}, URL đó được dùng.
 */
@Data
public class ConfirmWebhookManualRequest {

    /** Ví dụ: https://api.example.com/api/payment/webhook */
    private String webhookUrl;
}
