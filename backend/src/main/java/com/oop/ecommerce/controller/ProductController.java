package com.oop.ecommerce.controller;

import com.oop.ecommerce.dto.ProductResponseDto;
import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.oop.ecommerce.dto.ProductStatisticsDto;
import com.oop.ecommerce.dto.ProductUpsertRequest;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    @Autowired
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponseDto> getAllProducts() {
        return productService.getAllProducts().stream().map(this::toDto).toList();
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductStatisticsDto getStatistics() {
        return productService.getStatistics();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDto> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(p -> ResponseEntity.ok(toDto(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponseDto createProduct(@RequestBody ProductUpsertRequest req) {
        return toDto(productService.createProduct(req));
    }

    @PostMapping("/{id}/buy")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> buyProduct(@PathVariable Long id, @RequestParam(defaultValue = "1") int quantity) {
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            Product boughtProduct = productService.buyProduct(id, quantity, username);
            return ResponseEntity.ok(boughtProduct);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponseDto> updateProduct(@PathVariable Long id, @RequestBody ProductUpsertRequest req) {
        return productService.updateProduct(id, req)
                .map(p -> ResponseEntity.ok(toDto(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    private ProductResponseDto toDto(Product p) {
        return ProductResponseDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .stockQuantity(p.getStockQuantity())
                .category(p.getCategory())
                .imageUrl(p.getImageUrl())
                .soldQuantity(p.getSoldQuantity())
                .sizeQuantities(productService.getSizeQuantities(p.getId()))
                .build();
    }
}
