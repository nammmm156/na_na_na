package com.oop.ecommerce.controller;

import com.oop.ecommerce.dto.order.CreateOrderRequest;
import com.oop.ecommerce.dto.order.OrderPaymentStatusDto;
import com.oop.ecommerce.dto.order.OrderResponseDto;
import com.oop.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateOrderRequest body) {
        try {
            OrderResponseDto created = orderService.create(body, currentUsername());
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> detail(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(orderService.getForUser(orderId, currentUsername()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{orderId}/status")
    public ResponseEntity<OrderPaymentStatusDto> status(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(orderService.paymentStatusForUser(orderId, currentUsername()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private static String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
