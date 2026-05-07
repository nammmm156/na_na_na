package com.oop.ecommerce.config;

import com.oop.ecommerce.catalog.ShoeCatalog;
import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.model.ProductSizeStock;
import com.oop.ecommerce.model.Role;
import com.oop.ecommerce.model.User;
import com.oop.ecommerce.model.Voucher;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.ProductSizeStockRepository;
import com.oop.ecommerce.repository.UserRepository;
import com.oop.ecommerce.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductSizeStockRepository productSizeStockRepository;
    private final VoucherRepository voucherRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create default admin user
        if (!userRepository.existsByUsername("admin")) {
            User adminUser = User.builder()
                    .username("admin")
                    .email("admin@admin.com")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.ADMIN)
                    .build();

            userRepository.save(adminUser);
            System.out.println("Default admin user created: admin / admin");
        }

        // Seed sample products if database is empty
        if (productRepository.count() == 0) {
            List<ProductSeed> seeds = List.of(
                    new ProductSeed("Nike Air Force 1 '07", "Thiết kế kinh điển, dễ phối đồ, đế êm bền.", new BigDecimal("2790000"), "Giày Nike", "https://images.unsplash.com/photo-1528701800489-20be3c7f462e?auto=format&fit=crop&w=1200&q=80", 8),
                    new ProductSeed("Adidas Ultraboost", "Chạy bộ êm ái với đệm Boost, upper thoáng khí.", new BigDecimal("3890000"), "Giày Adidas", "https://images.unsplash.com/photo-1528701800489-20be3c7f462e?auto=format&fit=crop&w=1200&q=80", 6),
                    new ProductSeed("Puma Suede Classic", "Phong cách retro, form đẹp, đi chơi hằng ngày.", new BigDecimal("2290000"), "Giày Puma", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80", 5),
                    new ProductSeed("Lacoste Carnaby Evo", "Tối giản, lịch sự, phù hợp đi làm.", new BigDecimal("2590000"), "Giày Lacoste", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80", 4)
            );

            List<Product> saved = productRepository.saveAll(seeds.stream().map(ProductSeed::toProduct).toList());

            List<ProductSizeStock> stocks = new ArrayList<>();
            for (int i = 0; i < seeds.size(); i++) {
                Product p = saved.get(i);
                int perSize = seeds.get(i).qtyPerSize;
                int sizeCount = ShoeCatalog.MAX_EU_SHOE_SIZE - ShoeCatalog.MIN_EU_SHOE_SIZE + 1;
                for (int size = ShoeCatalog.MIN_EU_SHOE_SIZE; size <= ShoeCatalog.MAX_EU_SHOE_SIZE; size++) {
                    stocks.add(ProductSizeStock.builder()
                            .product(p)
                            .shoeSize(size)
                            .quantity(perSize)
                            .build());
                }
                p.setStockQuantity(perSize * sizeCount);
            }
            productRepository.saveAll(saved);
            productSizeStockRepository.saveAll(stocks);

            System.out.println("Seeded " + saved.size() + " sample shoe products.");
        }

        if (voucherRepository.count() == 0) {
            voucherRepository.saveAll(List.of(
                    Voucher.builder().code("WELCOME10").kind(Voucher.Kind.PERCENT).value(10).minSubtotal(100_000L).active(true).build(),
                    Voucher.builder().code("FREESHIP").kind(Voucher.Kind.FIXED).value(30_000).minSubtotal(200_000L).active(true).build(),
                    Voucher.builder().code("VIP50K").kind(Voucher.Kind.FIXED).value(50_000).minSubtotal(500_000L).active(true).build()
            ));
            System.out.println("Seeded default vouchers.");
        }
    }

    private record ProductSeed(String name, String description, BigDecimal price, String category, String imageUrl, int qtyPerSize) {
        Product toProduct() {
            Product p = new Product();
            p.setName(name);
            p.setDescription(description);
            p.setPrice(price);
            p.setCategory(category);
            p.setImageUrl(imageUrl);
            p.setSoldQuantity(0);
            p.setStockQuantity(0); // will be recomputed from per-size stock
            return p;
        }
    }
}
