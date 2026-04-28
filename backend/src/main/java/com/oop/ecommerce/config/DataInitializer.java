package com.oop.ecommerce.config;

import com.oop.ecommerce.model.Product;
import com.oop.ecommerce.model.Role;
import com.oop.ecommerce.model.User;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
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
            List<Product> products = List.of(
                    createProduct("Sony WH-1000XM5", "Tai nghe chống ồn chủ động, âm thanh chi tiết và thời lượng pin lâu.", new BigDecimal("8490000"), 18, "Headphones", "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80"),
                    createProduct("MacBook Air M2", "Laptop mỏng nhẹ, hiệu năng mạnh mẽ cho công việc sáng tạo và di động.", new BigDecimal("26990000"), 9, "Laptop", "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80"),
                    createProduct("Canon EOS R50", "Máy ảnh mirrorless nhỏ gọn, phù hợp quay vlog và chụp chân dung.", new BigDecimal("18990000"), 6, "Camera", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"),
                    createProduct("Apple Watch Series 9", "Đồng hồ thông minh theo dõi sức khỏe, luyện tập và thông báo tiện lợi.", new BigDecimal("9990000"), 15, "Smartwatch", "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=1200&q=80"),
                    createProduct("NOMATIC Backpack", "Balo đa năng cho đi làm và du lịch, nhiều ngăn và chống nước nhẹ.", new BigDecimal("3290000"), 24, "Backpack", "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=1200&q=80"),
                    createProduct("AirPods Pro (2nd Gen)", "Tai nghe true wireless với âm thanh không gian và chống ồn hiệu quả.", new BigDecimal("5790000"), 20, "Headphones", "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=80"),
                    createProduct("Dell XPS 13 Plus", "Thiết kế cao cấp, màn hình sắc nét và hiệu năng ổn định cho dân văn phòng.", new BigDecimal("32990000"), 5, "Laptop", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80"),
                    createProduct("Fujifilm X-T30 II", "Máy ảnh retro nhỏ gọn với màu phim đặc trưng, phù hợp người mới bắt đầu.", new BigDecimal("21490000"), 7, "Camera", "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80")
            );

            productRepository.saveAll(products);
            System.out.println("Seeded " + products.size() + " sample products.");
        }
    }

    private Product createProduct(String name, String description, BigDecimal price, int stock, String category, String imageUrl) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setStockQuantity(stock);
        product.setCategory(category);
        product.setImageUrl(imageUrl);
        product.setSoldQuantity(0);
        return product;
    }
}
