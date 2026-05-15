package com.oop.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewEligibilityDto {
    private boolean eligible;
    /** Human-readable reason when eligible is false (may be null when eligible). */
    private String message;
}
