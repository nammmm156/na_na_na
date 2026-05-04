package com.oop.ecommerce.repository;

import com.oop.ecommerce.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdAndUserUsername(Long id, String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.payosOrderCode = :code")
    Optional<Order> findLockedByPayosOrderCode(@Param("code") Long code);

    boolean existsByPayosOrderCode(Long payosOrderCode);
}