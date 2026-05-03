package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.CategorySalesDto;
import com.oop.ecommerce.dto.MonthlyRevenuePointDto;
import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.model.PurchaseTransaction;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.PurchaseTransactionRepository;
import com.oop.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.oop.ecommerce.dto.ProductStatisticsDto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final PurchaseTransactionRepository purchaseTransactionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public ProductService(
            ProductRepository productRepository,
            PurchaseTransactionRepository purchaseTransactionRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.productRepository = productRepository;
        this.purchaseTransactionRepository = purchaseTransactionRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public Optional<Product> updateProduct(Long id, Product updatedProduct) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    existingProduct.setName(updatedProduct.getName());
                    existingProduct.setDescription(updatedProduct.getDescription());
                    existingProduct.setPrice(updatedProduct.getPrice());
                    existingProduct.setStockQuantity(updatedProduct.getStockQuantity());
                    existingProduct.setCategory(updatedProduct.getCategory());
                    existingProduct.setImageUrl(updatedProduct.getImageUrl());
                    return productRepository.save(existingProduct);
                });
    }

    @Transactional
    public Product buyProduct(Long id, int quantity, String username) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        return productRepository.findById(id).map(product -> {
            if (product.getStockQuantity() < quantity) {
                throw new IllegalArgumentException("Not enough stock for product: " + product.getName());
            }

            product.setStockQuantity(product.getStockQuantity() - quantity);
            if (product.getSoldQuantity() == null) {
                product.setSoldQuantity(0);
            }
            product.setSoldQuantity(product.getSoldQuantity() + quantity);
            Product savedProduct = productRepository.save(product);

            BigDecimal unitPrice = savedProduct.getPrice() != null ? savedProduct.getPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            PurchaseTransaction tx = new PurchaseTransaction();
            tx.setProductId(savedProduct.getId());
            tx.setProductName(savedProduct.getName());
            tx.setCategory(normalizeCategory(savedProduct.getCategory()));
            tx.setUsername(username);
            tx.setQuantity(quantity);
            tx.setUnitPrice(unitPrice);
            tx.setLineTotal(lineTotal);
            tx.setPurchasedAt(java.time.LocalDateTime.now());
            purchaseTransactionRepository.save(tx);

            userRepository.findByUsername(username).ifPresent(user -> {
                emailService.sendPurchaseConfirmation(user.getEmail(), savedProduct, quantity);
            });

            return savedProduct;
        }).orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    public ProductStatisticsDto getStatistics() {
        List<Product> products = productRepository.findAll();
        List<PurchaseTransaction> transactions = purchaseTransactionRepository.findAll();

        long totalProducts = products.size();
        long totalItemsLeft = 0;

        for (Product p : products) {
            totalItemsLeft += (p.getStockQuantity() != null ? p.getStockQuantity() : 0);
        }

        long totalItemsSold = transactions.stream().mapToLong(t -> t.getQuantity() != null ? t.getQuantity() : 0).sum();
        BigDecimal totalRevenue = transactions.stream()
                .map(t -> t.getLineTotal() != null ? t.getLineTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<YearMonth, BigDecimal> revenueByMonth = aggregateMonthlyRevenue(transactions);
        Map<YearMonth, Long> soldByMonth = aggregateMonthlySold(transactions);

        ProductStatisticsDto dto = new ProductStatisticsDto();
        dto.setTotalProducts(totalProducts);
        dto.setTotalItemsLeft(totalItemsLeft);
        dto.setTotalItemsSold(totalItemsSold);
        dto.setTotalRevenue(totalRevenue);
        dto.setMonthlyRevenue(buildLastSixMonthSeries(revenueByMonth));
        dto.setRevenueGrowthPercent(calculateGrowthPercent(revenueByMonth, YearMonth.now()));
        dto.setItemsSoldGrowthPercent(calculateGrowthPercentLong(soldByMonth, YearMonth.now()));
        dto.setSalesByCategory(buildCategorySales(transactions));
        return dto;
    }

    private Map<YearMonth, BigDecimal> aggregateMonthlyRevenue(List<PurchaseTransaction> transactions) {
        Map<YearMonth, BigDecimal> out = new HashMap<>();
        for (PurchaseTransaction tx : transactions) {
            if (tx.getPurchasedAt() == null) continue;
            YearMonth ym = YearMonth.from(tx.getPurchasedAt());
            BigDecimal amount = tx.getLineTotal() != null ? tx.getLineTotal() : BigDecimal.ZERO;
            out.merge(ym, amount, BigDecimal::add);
        }
        return out;
    }

    private Map<YearMonth, Long> aggregateMonthlySold(List<PurchaseTransaction> transactions) {
        Map<YearMonth, Long> out = new HashMap<>();
        for (PurchaseTransaction tx : transactions) {
            if (tx.getPurchasedAt() == null) continue;
            YearMonth ym = YearMonth.from(tx.getPurchasedAt());
            long qty = tx.getQuantity() != null ? tx.getQuantity() : 0;
            out.merge(ym, qty, Long::sum);
        }
        return out;
    }

    private List<MonthlyRevenuePointDto> buildLastSixMonthSeries(Map<YearMonth, BigDecimal> revenueByMonth) {
        List<MonthlyRevenuePointDto> points = new ArrayList<>();
        YearMonth current = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            String label = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            BigDecimal value = revenueByMonth.getOrDefault(ym, BigDecimal.ZERO);
            points.add(new MonthlyRevenuePointDto(label, value));
        }
        return points;
    }

    private double calculateGrowthPercent(Map<YearMonth, BigDecimal> byMonth, YearMonth currentMonth) {
        BigDecimal current = byMonth.getOrDefault(currentMonth, BigDecimal.ZERO);
        BigDecimal previous = byMonth.getOrDefault(currentMonth.minusMonths(1), BigDecimal.ZERO);
        if (previous.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        BigDecimal diff = current.subtract(previous);
        return diff
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private double calculateGrowthPercentLong(Map<YearMonth, Long> byMonth, YearMonth currentMonth) {
        long current = byMonth.getOrDefault(currentMonth, 0L);
        long previous = byMonth.getOrDefault(currentMonth.minusMonths(1), 0L);
        if (previous <= 0) {
            return 0;
        }
        return BigDecimal.valueOf(current - previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(previous), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private List<CategorySalesDto> buildCategorySales(List<PurchaseTransaction> transactions) {
        Map<String, Long> categoryQty = new LinkedHashMap<>();
        for (PurchaseTransaction tx : transactions) {
            String category = normalizeCategory(tx.getCategory());
            long qty = tx.getQuantity() != null ? tx.getQuantity() : 0;
            if (qty <= 0) continue;
            categoryQty.merge(category, qty, Long::sum);
        }

        long totalQty = categoryQty.values().stream().mapToLong(Long::longValue).sum();
        if (totalQty <= 0) {
            return new ArrayList<>();
        }

        List<Map.Entry<String, Long>> entries = new ArrayList<>(categoryQty.entrySet());
        entries.sort(Comparator.comparingLong(Map.Entry<String, Long>::getValue).reversed());

        List<CategorySalesDto> result = new ArrayList<>();
        int remaining = 100;
        for (int i = 0; i < entries.size(); i++) {
            Map.Entry<String, Long> entry = entries.get(i);
            int pct;
            if (i == entries.size() - 1) {
                pct = Math.max(0, remaining);
            } else {
                pct = BigDecimal.valueOf(entry.getValue())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalQty), 0, RoundingMode.HALF_UP)
                        .intValue();
                pct = Math.min(remaining, pct);
                remaining -= pct;
            }
            result.add(new CategorySalesDto(entry.getKey(), pct));
        }
        return result;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "Khác";
        }
        return category.trim();
    }
}
