package com.oop.ecommerce.service;

import com.oop.ecommerce.model.Order;
import com.oop.ecommerce.model.OrderLineItem;
import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.model.ProductInventoryHistory;
import com.oop.ecommerce.model.AuditLog;
import com.oop.ecommerce.repository.AuditLogRepository;
import com.oop.ecommerce.repository.ProductInventoryHistoryRepository;
import com.oop.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderInventoryService {

    private final ProductRepository productRepository;
    private final ProductInventoryHistoryRepository inventoryHistoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;

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
            int stockBefore = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            if (stockBefore < qty) {
                throw new IllegalStateException("Không đủ tồn kho cho: " + product.getName());
            }

            product.setStockQuantity(stockBefore - qty);
            int sold = product.getSoldQuantity() == null ? 0 : product.getSoldQuantity();
            product.setSoldQuantity(sold + qty);
            Product savedProduct = productRepository.save(product);

            inventoryHistoryRepository.save(ProductInventoryHistory.builder()
                    .product(savedProduct)
                    .changeType("SALE")
                    .quantityChange(-qty)
                    .quantityBefore(stockBefore)
                    .quantityAfter(stockBefore - qty)
                    .reason("ORDER_PAID#" + order.getId())
                    .changedBy(order.getUser())
                    .build());

            emailService.sendPurchaseConfirmation(order.getUser().getEmail(), savedProduct, qty);
        }

        auditLogRepository.save(AuditLog.builder()
                .user(order.getUser())
                .entityName("Order")
                .entityId(order.getId())
                .action("PAYMENT_FULFILLED")
                .newValues("{\"orderId\":%d,\"method\":\"%s\"}".formatted(order.getId(), order.getPaymentMethod()))
                .build());
    }
}
