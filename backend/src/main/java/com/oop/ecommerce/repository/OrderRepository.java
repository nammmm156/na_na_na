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

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where o.status = :status")
    Long sumTotalAmountByStatus(@Param("status") OrderStatus status);

    @Query("select coalesce(sum(li.quantity), 0) from Order o join o.lineItems li where o.status = :status")
    Long sumItemsSoldByStatus(@Param("status") OrderStatus status);

    @Query("""
        select o.createdAt, o.totalAmount
        from Order o
        where o.status = :status
          and o.createdAt >= :from
          and o.createdAt < :to
        """)
    List<Object[]> findRevenuePointsBetween(
            @Param("status") OrderStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        select coalesce(p.category, 'Khác'), coalesce(sum(li.quantity), 0)
        from Order o
        join o.lineItems li
        join Product p on p.id = li.productId
        where o.status = :status
        group by p.category
        order by coalesce(sum(li.quantity), 0) desc
        """)
    List<Object[]> sumSoldQuantityByCategory(@Param("status") OrderStatus status);
}