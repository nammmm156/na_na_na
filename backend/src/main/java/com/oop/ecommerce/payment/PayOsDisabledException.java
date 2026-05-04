package com.oop.ecommerce.payment;

/**
 * Thrown when {@code payos.enabled=false} but code path expects gọi API PayOS (tạo link, xác nhận webhook, v.v.).
 */
public class PayOsDisabledException extends RuntimeException {

    public PayOsDisabledException() {
        super("PayOS is disabled.");
    }
}
