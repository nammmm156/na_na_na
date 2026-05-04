package com.oop.ecommerce.payment;

public final class OrderPaymentMethod {

    public static final String COD = "COD";
    /** VietQR via Napas 247 powered by PayOS checkout. */
    public static final String PAYOS_NAPAS247 = "PAYOS_NAPAS247";

    private OrderPaymentMethod() {}

    public static boolean isPayosNapas(String pm) {
        return PAYOS_NAPAS247.equals(pm);
    }

    /** COD and legacy mocked card / bank transfers settle inventory immediately after order creation. */
    public static boolean settlesImmediately(String pm) {
        return COD.equals(pm) || "CARD".equals(pm) || "BANK".equals(pm);
    }

    public static boolean isSupported(String pm) {
        return settlesImmediately(pm) || isPayosNapas(pm);
    }
}
