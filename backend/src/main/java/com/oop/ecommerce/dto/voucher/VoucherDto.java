package com.oop.ecommerce.dto.voucher;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VoucherDto {
    private String code;
    private String kind; // PERCENT or FIXED
    private Integer value;
    private Long minSubtotal;
    private boolean active;
}

