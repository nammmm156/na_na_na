package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.ReviewCreateRequest;
import com.oop.ecommerce.dto.ReviewEligibilityDto;
import com.oop.ecommerce.dto.ReviewResponseDto;
import com.oop.ecommerce.model.OrderStatus;
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

    @Transactional(readOnly = true)
    public ReviewEligibilityDto eligibilityForUser(Long userId, Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new IllegalArgumentException("Product not found");
        }
        return buildEligibility(userId, productId);
    }

    private ReviewEligibilityDto buildEligibility(Long userId, Long productId) {
        long paidCount = orderRepository.countPaidOrdersContainingProduct(userId, productId, OrderStatus.PAID);
        boolean purchased = paidCount > 0;
        boolean alreadyReviewed = reviewRepository.existsByUserIdAndProductId(userId, productId);
        if (!purchased) {
            return ReviewEligibilityDto.builder()
                    .eligible(false)
                    .message("Chỉ khách đã mua sản phẩm này (đơn đã thanh toán) mới được đánh giá.")
                    .build();
        }
        if (alreadyReviewed) {
            return ReviewEligibilityDto.builder()
                    .eligible(false)
                    .message("Bạn đã đánh giá sản phẩm này rồi.")
                    .build();
        }
        return ReviewEligibilityDto.builder().eligible(true).message(null).build();
    }

    @Transactional
    public ReviewResponseDto createReview(Long userId, ReviewCreateRequest request) {
        if (!productRepository.existsById(request.getProductId())) {
            throw new IllegalArgumentException("Product not found");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ReviewEligibilityDto gate = buildEligibility(userId, request.getProductId());
        if (!gate.isEligible()) {
            throw new IllegalArgumentException(gate.getMessage() != null ? gate.getMessage() : "Không thể gửi đánh giá.");
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
