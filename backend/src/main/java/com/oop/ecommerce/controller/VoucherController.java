package com.oop.ecommerce.controller;

import com.oop.ecommerce.dto.voucher.UpsertVoucherRequest;
import com.oop.ecommerce.dto.voucher.VoucherDto;
import com.oop.ecommerce.model.Voucher;
import com.oop.ecommerce.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/api/vouchers")
    public List<VoucherDto> listActive() {
        return voucherService.listActive().stream().map(VoucherController::toDto).toList();
    }

    @GetMapping("/api/admin/vouchers")
    @PreAuthorize("hasRole('ADMIN')")
    public List<VoucherDto> listAllForAdmin() {
        return voucherService.listAll().stream().map(VoucherController::toDto).toList();
    }

    @PostMapping("/api/admin/vouchers")
    @PreAuthorize("hasRole('ADMIN')")
    public VoucherDto upsert(@Valid @RequestBody UpsertVoucherRequest req) {
        return toDto(voucherService.upsert(req));
    }

    @DeleteMapping("/api/admin/vouchers/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        voucherService.deleteByCode(code);
        return ResponseEntity.noContent().build();
    }

    private static VoucherDto toDto(Voucher v) {
        return VoucherDto.builder()
                .code(v.getCode())
                .kind(v.getKind() == null ? null : v.getKind().name())
                .value(v.getValue())
                .minSubtotal(v.getMinSubtotal() == null ? 0L : v.getMinSubtotal())
                .active(v.isActive())
                .build();
    }
}

