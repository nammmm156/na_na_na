package com.oop.ecommerce.order;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Shared checkout math (line totals). Voucher discounts come from {@link com.oop.ecommerce.service.VoucherService}.
 */
public final class CheckoutPricing {

    private CheckoutPricing() {}

    public static long lineTotalRoundedVnd(BigDecimal unitPrice, int quantity) {
        BigDecimal unit = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        return unit.multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP).longValue();
    }
}
