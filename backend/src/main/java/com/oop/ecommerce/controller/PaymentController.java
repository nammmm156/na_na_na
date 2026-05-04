package com.oop.ecommerce.controller;

import com.oop.ecommerce.dto.payment.ConfirmWebhookManualRequest;
import com.oop.ecommerce.dto.payment.PaymentLinkResponseDto;
import com.oop.ecommerce.payment.PayOsDisabledException;
import com.oop.ecommerce.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.payos.exception.PayOSException;
import vn.payos.model.webhooks.ConfirmWebhookResponse;
import vn.payos.model.webhooks.Webhook;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-link/{orderId}")
    public ResponseEntity<?> createLink(@PathVariable Long orderId) {
        try {
            String username = currentUsername();
            log.info("Creating payment link for order {} by user {}", orderId, username);
            PaymentLinkResponseDto dto = paymentService.createPaymentLink(orderId, username);
            return ResponseEntity.ok(dto);
        } catch (PayOsDisabledException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (PayOSException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(e.getMessage());
        }
    }

    /** Admin: đăng ký / xác nhận URL webhook với PayOS (đọc SDK {@code webhooks().confirm}). */
    @PostMapping("/confirm-webhook")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> confirmWebhook(@RequestBody(required = false) ConfirmWebhookManualRequest body) {
        try {
            ConfirmWebhookResponse response = paymentService.confirmWebhookManual(body);
            return ResponseEntity.ok(response);
        } catch (PayOsDisabledException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (PayOSException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(e.getMessage());
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(@RequestBody Webhook body) {
        try {
            paymentService.handleWebhook(body);
            return ResponseEntity.ok("OK");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (PayOSException e) {
            return ResponseEntity.badRequest().body("Invalid webhook");
        }
    }

    private static String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/test/auth")
    public ResponseEntity<String> testAuth() {
        String username = currentUsername();
        return ResponseEntity.ok("Authenticated as: " + username);
    }
}
