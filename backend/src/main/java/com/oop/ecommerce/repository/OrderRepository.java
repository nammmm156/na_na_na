package com.oop.ecommerce.repository;

import com.oop.ecommerce.model.Order;
import com.oop.ecommerce.model.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdAndUserUsername(Long id, String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.payosOrderCode = :code")
    Optional<Order> findLockedByPayosOrderCode(@Param("code") Long code);

    boolean existsByPayosOrderCode(Long payosOrderCode);

    /** Tổng doanh thu thực thu (VND) — khớp PayOS / total_amount */
    @Query(value = "SELECT COALESCE(SUM(o.total_amount), 0) FROM customer_orders o WHERE o.status = 'PAID'", nativeQuery = true)
    Long sumPaidOrderTotalAmountVnd();

    @Query(value = "SELECT COALESCE(SUM(li.quantity), 0) FROM order_line_items li "
            + "INNER JOIN customer_orders o ON o.id = li.order_id WHERE o.status = 'PAID'", nativeQuery = true)
    Long sumPaidLineItemQuantities();

    List<Order> findByStatusAndCreatedAtGreaterThanEqual(OrderStatus status, LocalDateTime createdAt);

    @Query(value = "SELECT COALESCE(p.category, 'Khác') AS cat, COALESCE(SUM(li.unit_price * li.quantity), 0) AS rev "
            + "FROM order_line_items li "
            + "INNER JOIN customer_orders o ON o.id = li.order_id "
            + "INNER JOIN product p ON p.id = li.product_id "
            + "WHERE o.status = 'PAID' "
            + "GROUP BY COALESCE(p.category, 'Khác') ORDER BY rev DESC", nativeQuery = true)
    List<Object[]> sumPaidLineRevenueByCategory();
}