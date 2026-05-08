package com.oop.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_size_stock",
        uniqueConstraints = @UniqueConstraint(name = "uk_product_size_stock_product_size", columnNames = {"product_id", "shoe_size"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSizeStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "shoe_size", nullable = false)
    private Integer shoeSize;

    @Column(nullable = false)
    private Integer quantity;
}

