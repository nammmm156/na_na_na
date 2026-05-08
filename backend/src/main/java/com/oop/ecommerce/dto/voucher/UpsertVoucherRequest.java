package com.oop.ecommerce.dto.voucher;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpsertVoucherRequest {
    @NotBlank
    private String code;

    /** PERCENT or FIXED */
    @NotBlank
    private String kind;

    @NotNull
    @Min(1)
    @Max(1_000_000_000)
    private Integer value;

    @NotNull
    @Min(0)
    private Long minSubtotal;

    private Boolean active;
}

