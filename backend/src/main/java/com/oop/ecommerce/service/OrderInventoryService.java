package com.oop.ecommerce.service;

import com.oop.ecommerce.model.Order;
import com.oop.ecommerce.model.OrderLineItem;
import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.model.ProductInventoryHistory;
import com.oop.ecommerce.model.AuditLog;
import com.oop.ecommerce.model.ProductSizeStock;
import com.oop.ecommerce.dto.order.CreateOrderItemDto;
import com.oop.ecommerce.repository.AuditLogRepository;
import com.oop.ecommerce.repository.ProductInventoryHistoryRepository;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.ProductSizeStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderInventoryService {

    private final ProductRepository productRepository;
    private final ProductSizeStockRepository productSizeStockRepository;
    private final ProductInventoryHistoryRepository inventoryHistoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public void assertSufficientStockFor(List<CreateOrderItemDto> items) {
        Map<String, Integer> needByKey = new HashMap<>();
        for (CreateOrderItemDto it : items) {
            String key = it.getProductId() + ":" + it.getShoeSize();
            needByKey.merge(key, it.getQuantity(), Integer::sum);
        }
        for (Map.Entry<String, Integer> e : needByKey.entrySet()) {
            String[] parts = e.getKey().split(":");
            Long pid = Long.valueOf(parts[0]);
            Integer size = Integer.valueOf(parts[1]);
            Product p = productRepository.findById(pid)
                    .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại #" + pid));
            ProductSizeStock stock = productSizeStockRepository.findByProductIdAndShoeSize(pid, size)
                    .orElseThrow(() -> new IllegalArgumentException("Sản phẩm chưa có tồn kho size " + size + ": " + p.getName()));
            int before = stock.getQuantity() == null ? 0 : stock.getQuantity();
            if (before < e.getValue()) {
                throw new IllegalArgumentException("Không đủ tồn kho size " + size + " cho: " + p.getName());
            }
        }
    }

    /**
     * Deduct warehouse stock per line item, record {@link ProductInventoryHistory}, send confirmations,
     * and persist one {@link AuditLog} row for the completed payment.
     */
    @Transactional
    public void applyPaidInventoryAndAudit(Order order) {
        for (OrderLineItem line : order.getLineItems()) {
            Product product = productRepository.findById(line.getProductId())
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy sản phẩm #" + line.getProductId()));

            int qty = line.getQuantity();
            Integer size = line.getShoeSize();
            if (size == null) {
                throw new IllegalStateException("Thiếu size giày cho sản phẩm: " + product.getName());
            }
            ProductSizeStock sizeStock = productSizeStockRepository.findByProductIdAndShoeSize(product.getId(), size)
                    .orElseThrow(() -> new IllegalStateException("Không có tồn kho size " + size + " cho: " + product.getName()));

            int sizeBefore = sizeStock.getQuantity() == null ? 0 : sizeStock.getQuantity();
            if (sizeBefore < qty) {
                throw new IllegalStateException("Không đủ tồn kho size " + size + " cho: " + product.getName());
            }

            sizeStock.setQuantity(sizeBefore - qty);
            productSizeStockRepository.save(sizeStock);

            int stockBefore = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            product.setStockQuantity(Math.max(0, stockBefore - qty)); // keep total cache in sync
            int sold = product.getSoldQuantity() == null ? 0 : product.getSoldQuantity();
            product.setSoldQuantity(sold + qty);
            Product savedProduct = productRepository.save(product);

            inventoryHistoryRepository.save(ProductInventoryHistory.builder()
                    .product(savedProduct)
                    .changeType("SALE")
                    .quantityChange(-qty)
                    .quantityBefore(stockBefore)
                    .quantityAfter(stockBefore - qty)
                    .reason("ORDER_PAID#" + order.getId() + ":SIZE_" + size)
                    .changedBy(order.getUser())
                    .build());

            emailService.sendPurchaseConfirmation(order.getUser().getEmail(), savedProduct, qty);
        }

        try {
            auditLogRepository.save(AuditLog.builder()
                    .user(order.getUser())
                    .entityName("Order")
                    .entityId(order.getId())
                    .action("PAYMENT_FULFILLED")
                    .newValues("{\"orderId\":%d,\"method\":\"%s\"}".formatted(order.getId(), order.getPaymentMethod()))
                    .build());
        } catch (Exception e) {
            log.warn("Unable to persist audit log for order {}: {}", order.getId(), e.getMessage(), e);
        }
    }
}
