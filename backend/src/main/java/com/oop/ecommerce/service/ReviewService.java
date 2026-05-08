package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.ReviewCreateRequest;
import com.oop.ecommerce.dto.ReviewResponseDto;
import com.oop.ecommerce.model.Review;
import com.oop.ecommerce.model.User;
import com.oop.ecommerce.repository.OrderRepository;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.ReviewRepository;
import com.oop.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public List<ReviewResponseDto> findByProductId(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ReviewResponseDto createReview(Long userId, ReviewCreateRequest request) {
        if (!productRepository.existsById(request.getProductId())) {
            throw new IllegalArgumentException("Product not found");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean bought = orderRepository.hasPaidPurchaseForProduct(userId, request.getProductId());
        if (!bought) {
            throw new IllegalStateException("Chỉ khách hàng đã mua sản phẩm mới được đánh giá.");
        }

        String comment = request.getComment() != null ? request.getComment().trim() : "";

        Review review = Review.builder()
                .productId(request.getProductId())
                .userId(user.getId())
                .rating(request.getRating())
                .comment(comment.isEmpty() ? null : comment)
                .build();
        review = reviewRepository.save(review);
        return toDto(review, user.getUsername());
    }

    private ReviewResponseDto toDto(Review r) {
        String username = userRepository.findById(r.getUserId())
                .map(User::getUsername)
                .orElse("Ẩn danh");
        return toDto(r, username);
    }

    private ReviewResponseDto toDto(Review r, String username) {
        return ReviewResponseDto.builder()
                .id(r.getId())
                .productId(r.getProductId())
                .userId(r.getUserId())
                .username(username)
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
