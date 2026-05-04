package com.oop.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(length = 64)
    private String paymentMethod;

    @Column(name = "payment_link_id")
    private String paymentLinkId;

    /** PayOS payment-request order code returned in webhook (unique per merchant). */
    @Column(name = "payos_order_code", unique = true)
    private Long payosOrderCode;

    /** Cached redirect URL from last create-link call (replay without duplicating PayOS requests). */
    @Column(name = "payos_checkout_url", length = 4096)
    private String payosCheckoutUrl;

    /** Total payable amount in integer VND (matches PayOS `amount`). */
    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Column(name = "subtotal_amount", nullable = false)
    private Long subtotalAmount;

    @Column(name = "discount_amount", nullable = false)
    private Long discountAmount;

    @Column(name = "voucher_code")
    private String voucherCode;

    @Column(length = 255)
    private String shipFullName;

    @Column(length = 64)
    private String shipPhone;

    @Column(length = 512)
    private String shipAddressLine;

    @Column(length = 128)
    private String shipCity;

    @Column(columnDefinition = "TEXT")
    private String note;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderLineItem> lineItems = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public void addLineItem(OrderLineItem line) {
        lineItems.add(line);
        line.setOrder(this);
    }
}
