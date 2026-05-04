package com.oop.ecommerce.service;

import com.oop.ecommerce.config.PayOSProperties;
import com.oop.ecommerce.dto.payment.ConfirmWebhookManualRequest;
import com.oop.ecommerce.dto.payment.PaymentLinkResponseDto;
import com.oop.ecommerce.model.Order;
import com.oop.ecommerce.model.OrderStatus;
import com.oop.ecommerce.payment.OrderPaymentMethod;
import com.oop.ecommerce.payment.PayOsDisabledException;
import com.oop.ecommerce.payment.PayOsSdkAdapters;
import com.oop.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.payos.PayOS;
import vn.payos.exception.PayOSException;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.ConfirmWebhookResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PayOSProperties payOSProperties;
    private final OrderInventoryService orderInventoryService;
    private final ObjectProvider<PayOS> payOSProvider;

    /**
     * PayOS chỉ được gọi khi đã enabled và có bean — ném {@link PayOsDisabledException} nếu không.
     */
    private PayOS requirePayOsClient() {
        if (!payOSProperties.isEnabled()) {
            log.warn("PayOS is disabled");
            throw new PayOsDisabledException();
        }
        PayOS client = payOSProvider.getIfAvailable();
        if (client == null) {
            throw new IllegalStateException(
                    "payos.enabled=true nhưng PayOS bean chưa được tạo — kiểm tra client-id/api-key/checksum.");
        }
        return client;
    }

    /**
     * Đăng ký webhook với PayOS (ping thử endpoint). ADMIN gọi thủ công qua API.
     */
    public ConfirmWebhookResponse confirmWebhookManual(ConfirmWebhookManualRequest request) throws PayOSException {
        String override = request == null ? null : request.getWebhookUrl();
        return confirmWebhook(override);
    }

    /** Gọi {@link vn.payos.service.blocking.webhooks.WebhooksService#confirm(String)}. */
    public ConfirmWebhookResponse confirmWebhook(String webhookUrlOverride) throws PayOSException {
        PayOS client = requirePayOsClient();
        String url = resolveWebhookRegistrationUrl(webhookUrlOverride);
        log.info("PayOS webhook confirm/register for URL {}", url);
        try {
            ConfirmWebhookResponse response = client.webhooks().confirm(url);
            return response;
        } catch (PayOSException e) {
            log.error("Lỗi khi confirm webhook với PayOS cho URL: {}", url, e);
            throw new RuntimeException("Không thể confirm webhook: " + e.getMessage(), e);
        }
    }

    private String resolveWebhookRegistrationUrl(String webhookUrlOverride) {
        String fromRequest = webhookUrlOverride == null ? "" : webhookUrlOverride.trim();
        String fromConfig = payOSProperties.sanitizedWebhookPublicUrl();
        String chosen = StringUtils.hasText(fromRequest) ? fromRequest : fromConfig;
        if (!StringUtils.hasText(chosen)) {
            throw new IllegalArgumentException(
                    "Chưa có webhook URL — truyền JSON {\"webhookUrl\":\"https://.../api/payment/webhook\"} hoặc cấu hình payos.webhook-public-url.");
        }
        return chosen.replaceAll("/+$", "");
    }

    @Transactional
    public PaymentLinkResponseDto createPaymentLink(Long orderId, String username) throws PayOSException {
        PayOS client = requirePayOsClient();

        Order order = orderRepository.findByIdAndUserUsername(orderId, username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng."));

        if (!OrderPaymentMethod.isPayosNapas(order.getPaymentMethod())) {
            throw new IllegalStateException("Đơn hàng không sử dụng PayOS Napas.");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Trạng thái đơn không hợp lệ để tạo link thanh toán.");
        }

        if (StringUtils.hasText(order.getPayosCheckoutUrl())) {
            return new PaymentLinkResponseDto(order.getId(), order.getPayosCheckoutUrl());
        }

        allocatePayOsOrderCodeIfAbsent(order);

        String base = payOSProperties.sanitizedFrontendBaseUrl();
        if (!StringUtils.hasText(base)) {
            throw new IllegalStateException(
                    "Thiếu payos.frontend-base-url trong cấu hình — cần cho returnUrl và cancelUrl.");
        }
        String returnUrl = base + "/payment/success?orderId=" + order.getId();
        String cancelUrl = base + "/cart";

        PaymentLinkItem cartItem = PaymentLinkItem.builder()
                .name("Đơn hàng #" + order.getId())
                .quantity(1)
                .price(order.getTotalAmount())
                .build();

        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderCode(order.getPayosOrderCode())
                .amount(order.getTotalAmount())
                .description("Thanh toán đơn #" + order.getId())
                .cancelUrl(cancelUrl)
                .returnUrl(returnUrl)
                .item(cartItem)
                .build();

        try {
            CreatePaymentLinkResponse resp = client.paymentRequests().create(request);
            String checkoutUrl = PayOsSdkAdapters.checkoutRedirectUrl(resp);
            String pid = PayOsSdkAdapters.paymentLinkId(resp);
            if (StringUtils.hasText(pid)) {
                order.setPaymentLinkId(pid);
            }

            order.setPayosCheckoutUrl(checkoutUrl);
            orderRepository.save(order);

            return new PaymentLinkResponseDto(order.getId(), checkoutUrl);
        } catch (PayOSException e) {
            log.error("Lỗi khi tạo payment link với PayOS cho đơn hàng {}", orderId, e);
            throw new RuntimeException("Không thể tạo payment link: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void handleWebhook(Webhook webhook) throws PayOSException {
        Objects.requireNonNull(webhook, "Webhook body không được để trống");
        if (!payOSProperties.isEnabled()) {
            log.warn("PayOS is disabled — webhook request ignored");
            return;
        }
        PayOS client = payOSProvider.getIfAvailable();
        if (client == null) {
            log.error("Webhook nhận được nhưng PayOS bean không tồn tại — kiểm tra cấu hình PayOS bean.");
            throw new IllegalStateException("PayOS không khả dụng để verify webhook.");
        }

        try {
            WebhookData data = client.webhooks().verify(webhook);
            String code = data.getCode();
            if (code != null && !"00".equals(code)) {
                return;
            }

            long payOsCode = Objects.requireNonNull(data.getOrderCode(), "Webhook thiếu orderCode").longValue();
            Order payOrder =
                    orderRepository.findLockedByPayosOrderCode(payOsCode).orElseThrow(
                            () -> new IllegalArgumentException("orderCode không khớp đơn cục bộ"));

            if (payOrder.getStatus() != OrderStatus.PENDING) {
                return;
            }

            long paidAmount = Objects.requireNonNull(data.getAmount(), "Webhook thiếu amount").longValue();
            if (paidAmount != payOrder.getTotalAmount()) {
                throw new IllegalStateException("Số tiền webhook không khớp tổng đơn hàng.");
            }

            String pid = StringUtils.hasText(data.getPaymentLinkId()) ? data.getPaymentLinkId() : payOrder.getPaymentLinkId();
            payOrder.setPaymentLinkId(pid);

            orderInventoryService.applyPaidInventoryAndAudit(payOrder);
            payOrder.setStatus(OrderStatus.PAID);
            orderRepository.save(payOrder);
        } catch (PayOSException e) {
            log.error("Lỗi khi verify webhook từ PayOS", e);
            throw new RuntimeException("Không thể xác thực webhook: " + e.getMessage(), e);
        }
    }

    private void allocatePayOsOrderCodeIfAbsent(Order order) {
        if (order.getPayosOrderCode() != null) {
            return;
        }
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        int guard = 0;
        Long chosen = null;
        while (guard++ < 200) {
            long candidate = (System.currentTimeMillis() / 1000) * 1_000_000L + rnd.nextLong(1, 999_999L);
            if (!orderRepository.existsByPayosOrderCode(candidate)) {
                chosen = candidate;
                break;
            }
        }
        if (chosen == null) {
            throw new IllegalStateException("Không sinh được mã orderCode PayOS duy nhất.");
        }
        order.setPayosOrderCode(chosen);
        orderRepository.save(order);
    }
}
