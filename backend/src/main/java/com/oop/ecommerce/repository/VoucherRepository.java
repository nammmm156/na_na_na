package com.oop.ecommerce.repository;

import com.oop.ecommerce.model.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findByActiveTrueOrderByCreatedAtDesc();
    Optional<Voucher> findByCodeIgnoreCase(String code);
    void deleteByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
}

