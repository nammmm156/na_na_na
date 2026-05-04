package com.oop.ecommerce.order;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Mirrors {@code ShopContext.jsx} vouchers so server totals match storefront rules.
 */
public final class CheckoutPricing {

    private enum VoucherKind {
        PERCENT,
        FIXED
    }

    private record Rule(String code, VoucherKind kind, int value, long minSubtotal) {}

    private static final Rule[] RULES = {
            new Rule("WELCOME10", VoucherKind.PERCENT, 10, 100_000L),
            new Rule("FREESHIP", VoucherKind.FIXED, 30_000, 200_000L),
            new Rule("VIP50K", VoucherKind.FIXED, 50_000, 500_000L),
    };

    private CheckoutPricing() {}

    /**
     * @param rawCode voucher code exactly as typed by shopper (ASCII, case insensitive)
     * @param subtotal  integer VND
     */
    public static long discountForVoucher(String rawCode, long subtotal) {
        if (rawCode == null || rawCode.isBlank()) {
            return 0;
        }
        String normalized = rawCode.trim().toUpperCase();
        for (Rule r : RULES) {
            if (r.code.equals(normalized)) {
                if (subtotal < r.minSubtotal) {
                    return 0;
                }
                if (r.kind == VoucherKind.PERCENT) {
                    return Math.round((double) subtotal * r.value / 100);
                }
                return Math.min(subtotal, r.value);
            }
        }
        return 0;
    }

    public static long lineTotalRoundedVnd(BigDecimal unitPrice, int quantity) {
        BigDecimal unit = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        return unit.multiply(BigDecimal.valueOf(quantity)).setScale(0, RoundingMode.HALF_UP).longValue();
    }
}
