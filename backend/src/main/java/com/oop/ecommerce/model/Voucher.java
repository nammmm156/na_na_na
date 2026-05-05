package com.oop.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "vouchers", indexes = {
        @Index(name = "idx_vouchers_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    public enum Kind {
        PERCENT,
        FIXED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Kind kind;

    @Column(nullable = false)
    private Integer value;

    @Column(name = "min_subtotal", nullable = false)
    private Long minSubtotal;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at")
    private Instant createdAt;
}

