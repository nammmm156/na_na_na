package com.oop.ecommerce.controller;

import com.oop.ecommerce.dto.ReviewCreateRequest;
import com.oop.ecommerce.dto.ReviewResponseDto;
import com.oop.ecommerce.security.CustomUserDetails;
import com.oop.ecommerce.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{productId}")
    public List<ReviewResponseDto> getReviewsForProduct(@PathVariable Long productId) {
        return reviewService.findByProductId(productId);
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @Valid @RequestBody ReviewCreateRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        CustomUserDetails details = (CustomUserDetails) authentication.getPrincipal();
        Long userId = details.getUser().getId();
        try {
            ReviewResponseDto created = reviewService.createReview(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
