package com.oop.ecommerce.service;

import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.model.ProductSizeStock;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.ProductSizeStockRepository;
import com.oop.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.oop.ecommerce.dto.ProductUpsertRequest;
import com.oop.ecommerce.dto.ProductStatisticsDto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductSizeStockRepository productSizeStockRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public ProductService(ProductRepository productRepository, ProductSizeStockRepository productSizeStockRepository, UserRepository userRepository, EmailService emailService) {
        this.productRepository = productRepository;
        this.productSizeStockRepository = productSizeStockRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Map<Integer, Integer> getSizeQuantities(Long productId) {
        Map<Integer, Integer> out = new HashMap<>();
        for (ProductSizeStock s : productSizeStockRepository.findByProductId(productId)) {
            if (s.getShoeSize() != null) {
                out.put(s.getShoeSize(), s.getQuantity() == null ? 0 : s.getQuantity());
            }
        }
        return out;
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    public Product createProduct(ProductUpsertRequest req) {
        Product p = new Product();
        applyUpsert(p, req);
        Product saved = productRepository.save(p);
        upsertSizeStocks(saved, req.getSizeQuantities());
        return productRepository.save(saved);
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

    public Optional<Product> updateProduct(Long id, ProductUpsertRequest req) {
        return productRepository.findById(id).map(p -> {
            applyUpsert(p, req);
            Product saved = productRepository.save(p);
            upsertSizeStocks(saved, req.getSizeQuantities());
            return productRepository.save(saved);
        });
    }

    public Product buyProduct(Long id, int quantity, String username) {
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

            // Fetch user and send email
            userRepository.findByUsername(username).ifPresent(user -> {
                emailService.sendPurchaseConfirmation(user.getEmail(), savedProduct, quantity);
            });

            return savedProduct;
        }).orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
    }

    public ProductStatisticsDto getStatistics() {
        List<Product> products = productRepository.findAll();
        long totalProducts = products.size();
        long totalItemsLeft = 0;
        long totalItemsSold = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Product p : products) {
            totalItemsLeft += (p.getStockQuantity() != null ? p.getStockQuantity() : 0);
            long sold = (p.getSoldQuantity() != null ? p.getSoldQuantity() : 0);
            totalItemsSold += sold;
            
            if (p.getPrice() != null) {
                totalRevenue = totalRevenue.add(p.getPrice().multiply(BigDecimal.valueOf(sold)));
            }
        }

        return new ProductStatisticsDto(totalProducts, totalItemsLeft, totalItemsSold, totalRevenue);
    }

    private static void applyUpsert(Product p, ProductUpsertRequest req) {
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setCategory(req.getCategory());
        p.setImageUrl(req.getImageUrl());
        if (p.getSoldQuantity() == null) p.setSoldQuantity(0);
    }

    private void upsertSizeStocks(Product product, Map<Integer, Integer> sizeQuantities) {
        Map<Integer, Integer> incoming = sizeQuantities != null ? sizeQuantities : Map.of();

        Map<Integer, ProductSizeStock> existingBySize = new HashMap<>();
        for (ProductSizeStock s : productSizeStockRepository.findByProductId(product.getId())) {
            existingBySize.put(s.getShoeSize(), s);
        }

        int total = 0;
        for (int size = 35; size <= 45; size++) {
            int qty = Math.max(0, incoming.getOrDefault(size, 0));
            ProductSizeStock row = existingBySize.get(size);
            if (row == null) {
                row = ProductSizeStock.builder().product(product).shoeSize(size).quantity(qty).build();
            } else {
                row.setQuantity(qty);
            }
            productSizeStockRepository.save(row);
            total += qty;
        }

        product.setStockQuantity(total);
    }
}
