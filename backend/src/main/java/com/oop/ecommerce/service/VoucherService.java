package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.voucher.UpsertVoucherRequest;
import com.oop.ecommerce.model.Voucher;
import com.oop.ecommerce.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    @Transactional(readOnly = true)
    public List<Voucher> listActive() {
        return voucherRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public Voucher upsert(UpsertVoucherRequest req) {
        String code = normalizeCode(req.getCode());
        Voucher.Kind kind;
        try {
            kind = Voucher.Kind.valueOf(req.getKind().trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("kind phải là PERCENT hoặc FIXED");
        }

        Voucher v = voucherRepository.findByCodeIgnoreCase(code).orElseGet(Voucher::new);
        v.setCode(code);
        v.setKind(kind);
        v.setValue(req.getValue());
        v.setMinSubtotal(req.getMinSubtotal() == null ? 0L : req.getMinSubtotal());
        if (req.getActive() != null) v.setActive(req.getActive());
        return voucherRepository.save(v);
    }

    @Transactional
    public void deleteByCode(String code) {
        voucherRepository.deleteByCodeIgnoreCase(normalizeCode(code));
    }

    @Transactional(readOnly = true)
    public long discountFor(String code, long subtotal) {
        if (code == null || code.isBlank()) return 0;
        Voucher v = voucherRepository.findByCodeIgnoreCase(code.trim())
                .filter(Voucher::isActive)
                .orElse(null);
        if (v == null) return 0;
        long min = v.getMinSubtotal() == null ? 0 : v.getMinSubtotal();
        if (subtotal < min) return 0;
        int value = v.getValue() == null ? 0 : v.getValue();
        if (v.getKind() == Voucher.Kind.PERCENT) {
            return Math.round((double) subtotal * value / 100.0);
        }
        if (v.getKind() == Voucher.Kind.FIXED) {
            return Math.min(subtotal, value);
        }
        return 0;
    }

    private static String normalizeCode(String raw) {
        if (raw == null) return "";
        return raw.trim().toUpperCase();
    }
}

