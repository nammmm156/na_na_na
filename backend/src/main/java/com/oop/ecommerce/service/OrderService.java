package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.order.CreateOrderAddressDto;
import com.oop.ecommerce.dto.order.CreateOrderItemDto;
import com.oop.ecommerce.dto.order.CreateOrderRequest;
import com.oop.ecommerce.dto.order.OrderLineResponseDto;
import com.oop.ecommerce.dto.order.OrderPaymentStatusDto;
import com.oop.ecommerce.dto.order.OrderResponseDto;
import com.oop.ecommerce.model.Order;
import com.oop.ecommerce.model.OrderLineItem;
import com.oop.ecommerce.model.OrderStatus;
import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.model.User;
import com.oop.ecommerce.order.CheckoutPricing;
import com.oop.ecommerce.payment.OrderPaymentMethod;
import com.oop.ecommerce.repository.OrderRepository;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderInventoryService orderInventoryService;

    @Transactional
    public OrderResponseDto create(CreateOrderRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại."));

        String pm = request.getPaymentMethod().trim();
        if (!OrderPaymentMethod.isSupported(pm)) {
            throw new IllegalArgumentException("Phương thức thanh toán không được hỗ trợ.");
        }

        Map<Long, Product> productsById = new LinkedHashMap<>();
        long subtotal = 0;

        for (CreateOrderItemDto line : request.getItems()) {
            Product p = productRepository.findById(line.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại #" + line.getProductId()));

            int stock = p.getStockQuantity() == null ? 0 : p.getStockQuantity();
            if (stock < line.getQuantity()) {
                throw new IllegalArgumentException("Không đủ tồn kho: " + p.getName());
            }

            productsById.put(p.getId(), p);
            subtotal += CheckoutPricing.lineTotalRoundedVnd(p.getPrice(), line.getQuantity());
        }

        String appliedVoucher = request.getVoucherCode();
        appliedVoucher = (appliedVoucher == null || appliedVoucher.isBlank()) ? null : appliedVoucher.trim().toUpperCase();
        long discount = CheckoutPricing.discountForVoucher(appliedVoucher, subtotal);
        long total = Math.max(0, subtotal - discount);

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .paymentMethod(pm)
                .subtotalAmount(subtotal)
                .discountAmount(discount)
                .totalAmount(total)
                .voucherCode(appliedVoucher)
                .build();

        CreateOrderAddressDto ship = request.getShippingAddress();
        order.setShipFullName(ship.getFullName());
        order.setShipPhone(ship.getPhone());
        order.setShipAddressLine(ship.getAddressLine());
        order.setShipCity(ship.getCity());
        order.setNote(request.getNote());

        for (CreateOrderItemDto line : request.getItems()) {
            Product p = productsById.get(line.getProductId());
            OrderLineItem li = OrderLineItem.builder()
                    .productId(p.getId())
                    .productName(p.getName())
                    .unitPrice(p.getPrice())
                    .quantity(line.getQuantity())
                    .build();
            order.addLineItem(li);
        }

        orderRepository.save(order);

        if (OrderPaymentMethod.settlesImmediately(pm)) {
            orderInventoryService.applyPaidInventoryAndAudit(order);
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
        }

        return toDto(order);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getForUser(Long orderId, String username) {
        Order order = orderRepository.findByIdAndUserUsername(orderId, username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng."));
        order.getLineItems().size(); // hydrate lines
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public OrderPaymentStatusDto paymentStatusForUser(Long orderId, String username) {
        Order order = orderRepository.findByIdAndUserUsername(orderId, username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng."));
        return OrderPaymentStatusDto.builder()
                .orderId(order.getId())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .build();
    }

    private OrderResponseDto toDto(Order o) {
        List<OrderLineResponseDto> lines = o.getLineItems().stream()
                .map(li -> OrderLineResponseDto.builder()
                        .productId(li.getProductId())
                        .productName(li.getProductName())
                        .quantity(li.getQuantity())
                        .unitPrice(li.getUnitPrice())
                        .build())
                .toList();

        return OrderResponseDto.builder()
                .id(o.getId())
                .status(o.getStatus().name())
                .subtotalAmount(o.getSubtotalAmount())
                .discountAmount(o.getDiscountAmount())
                .totalAmount(o.getTotalAmount())
                .paymentMethod(o.getPaymentMethod())
                .voucherCode(o.getVoucherCode())
                .shipFullName(o.getShipFullName())
                .shipPhone(o.getShipPhone())
                .shipAddressLine(o.getShipAddressLine())
                .shipCity(o.getShipCity())
                .note(o.getNote())
                .lineItems(lines)
                .build();
    }
}
