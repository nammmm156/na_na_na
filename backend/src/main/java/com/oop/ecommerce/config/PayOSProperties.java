package com.oop.ecommerce.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "payos")
public class PayOSProperties {

    /**
     * Set true only when credentials are configured; keeps local dev runnable without PayOS.
     */
    private boolean enabled = false;

    /**
     * PayOS client id (from payos.vn dashboard).
     */
    private String clientId = "";

    private String apiKey = "";

    private String checksumKey = "";

    /**
     * Public URL of the storefront (no trailing slash), e.g. http://localhost:5173.
     */
    private String frontendBaseUrl = "";

    /**
     * Full public HTTPS URL mà PayOS được gửi webhook tới ({@code POST /api/payment/webhook});
     * dùng khi không truyền {@code webhookUrl} trong {@code POST /api/payment/confirm-webhook}.
     */
    private String webhookPublicUrl = "";

    /** Chuẩn hóa base URL (không slash cuối) — chỉ đọc từ properties, không hardcode trong service. */
    public String sanitizedFrontendBaseUrl() {
        return trailingSlash(trimToEmpty(frontendBaseUrl));
    }

    public String sanitizedWebhookPublicUrl() {
        return trimToEmpty(webhookPublicUrl);
    }

    private static String trimToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static String trailingSlash(String base) {
        if (base.isEmpty()) {
            return "";
        }
        return base.replaceAll("/+$", "");
    }
}
