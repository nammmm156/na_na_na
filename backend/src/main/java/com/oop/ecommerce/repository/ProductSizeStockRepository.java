package com.oop.ecommerce.repository;

import com.oop.ecommerce.model.ProductSizeStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductSizeStockRepository extends JpaRepository<ProductSizeStock, Long> {
    List<ProductSizeStock> findByProductId(Long productId);
    Optional<ProductSizeStock> findByProductIdAndShoeSize(Long productId, Integer shoeSize);
    void deleteByProductId(Long productId);
}

