package com.oop.ecommerce.repository;

import com.oop.ecommerce.model.ProductSizeStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductSizeStockRepository extends JpaRepository<ProductSizeStock, Long> {
    List<ProductSizeStock> findByProductId(Long productId);
    Optional<ProductSizeStock> findByProductIdAndShoeSize(Long productId, Integer shoeSize);
    void deleteByProductId(Long productId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ProductSizeStock s WHERE s.product.id = :productId AND (s.shoeSize < :minSize OR s.shoeSize > :maxSize)")
    void deleteByProductIdAndSizeOutsideRange(@Param("productId") Long productId, @Param("minSize") int minSize, @Param("maxSize") int maxSize);

    @Query("SELECT s.shoeSize, SUM(s.quantity) FROM ProductSizeStock s GROUP BY s.shoeSize ORDER BY s.shoeSize")
    List<Object[]> sumQuantityGroupedByShoeSize();
}

