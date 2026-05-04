package com.oop.ecommerce.payment;

import org.springframework.util.StringUtils;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.lang.reflect.Method;

/**
 * Tách lớp một chỗ để khi SDK đổi tên getter (phiên bản khác nhau) chỉnh sửa dễ dàng.
 *
 * @see vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse (main: có {@code checkoutUrl})
 */
public final class PayOsSdkAdapters {

    private PayOsSdkAdapters() {}

    public static String checkoutRedirectUrl(CreatePaymentLinkResponse response) {
        if (response == null) {
            throw new IllegalArgumentException("PayOS: response rỗng");
        }

        try {
            String direct = response.getCheckoutUrl();
            if (StringUtils.hasText(direct)) {
                return direct;
            }
        } catch (Exception ignored) {
            // Fallback reflect bên dưới (SDK không chuẩn / fork)
        }

        String alt =
                invokeStringGetter(response, "getPaymentUrl", "getCheckoutURL", "getUrl", "getLink");
        if (StringUtils.hasText(alt)) {
            return alt;
        }

        throw new IllegalStateException(
                "PayOS SDK: không đọc được URL thanh toán (checkoutUrl/paymentUrl). Cập nhật PayOsSdkAdapters hoặc phiên bản payos-java.");
    }

    public static String paymentLinkId(CreatePaymentLinkResponse response) {
        if (response == null) {
            return null;
        }
        try {
            String pid = response.getPaymentLinkId();
            if (StringUtils.hasText(pid)) {
                return pid;
            }
        } catch (Exception ignored) {
            // Reflect fallback
        }
        return invokeReadableString(response, "getId");
    }

    private static String invokeStringGetter(Object target, String... methodNames) {
        for (String name : methodNames) {
            try {
                Method m = target.getClass().getMethod(name);
                Class<?> rt = m.getReturnType();
                if (!rt.equals(String.class) && !rt.equals(Object.class)) {
                    continue;
                }
                Object v = m.invoke(target);
                if (v instanceof String s && StringUtils.hasText(s)) {
                    return s;
                }
            } catch (ReflectiveOperationException ignored) {
                // next
            }
        }
        return null;
    }

    /** Any non-null return value -> {@link String}; hỗ trợ {@code Number} hoặc object khác (.toString). */
    private static String invokeReadableString(Object target, String... methodNames) {
        for (String name : methodNames) {
            try {
                Method m = target.getClass().getMethod(name);
                Object v = m.invoke(target);
                if (v == null) {
                    continue;
                }
                if (v instanceof String s) {
                    return StringUtils.hasText(s) ? s : null;
                }
                String s = v.toString();
                return StringUtils.hasText(s) ? s : null;
            } catch (ReflectiveOperationException ignored) {
                // next
            }
        }
        return null;
    }
}
