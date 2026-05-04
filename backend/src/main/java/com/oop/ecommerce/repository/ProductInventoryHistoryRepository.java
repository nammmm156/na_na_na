package com.oop.ecommerce.repository;

import com.oop.ecommerce.model.ProductInventoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductInventoryHistoryRepository extends JpaRepository<ProductInventoryHistory, Long> {}
