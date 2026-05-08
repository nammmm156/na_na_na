package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.AdminDashboardStatsDto;
import com.oop.ecommerce.dto.DailyRevenuePointDto;
import com.oop.ecommerce.dto.ShoeSizeStockShareDto;
import com.oop.ecommerce.model.Order;
import com.oop.ecommerce.model.OrderStatus;
import com.oop.ecommerce.repository.OrderRepository;
import com.oop.ecommerce.repository.ProductRepository;
import com.oop.ecommerce.repository.ProductSizeStockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gom số liệu dashboard admin — chỉ đọc, không ghi DB.
 * Doanh thu tổng: SUM(total_amount) đơn PAID (khớp số tiền thực thanh toán).
 */
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter LABEL_FMT = DateTimeFormatter.ofPattern("d/M");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductSizeStockRepository productSizeStockRepository;

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getDashboardStats() {
        Long revenueLong = orderRepository.sumPaidOrderTotalAmountVnd();
        BigDecimal totalRevenue = BigDecimal.valueOf(revenueLong != null ? revenueLong : 0L);

        long totalProducts = productRepository.count();
        long itemsInStock = productRepository.sumStockQuantity();
        Long soldBoxed = orderRepository.sumPaidLineItemQuantities();
        long itemsSold = soldBoxed != null ? soldBoxed : 0L;

        LocalDate today = LocalDate.now(REPORT_ZONE);
        YearMonth ym = YearMonth.from(today);
        LocalDate startDay = ym.atDay(1);
        LocalDate endDay = ym.atEndOfMonth();
        var rangeStart = startDay.atStartOfDay(REPORT_ZONE).toLocalDateTime();

        List<Order> paidInRange = orderRepository.findByStatusAndCreatedAtGreaterThanEqual(OrderStatus.PAID, rangeStart);
        List<DailyRevenuePointDto> daily = buildDailyRevenueSeries(startDay, endDay, paidInRange);
        List<ShoeSizeStockShareDto> stockBySize = buildStockSharesByShoeSize();

        return new AdminDashboardStatsDto(totalRevenue, totalProducts, itemsInStock, itemsSold, daily, stockBySize);
    }

    private List<DailyRevenuePointDto> buildDailyRevenueSeries(LocalDate startDay, LocalDate endDay, List<Order> paidInRange) {
        Map<LocalDate, Long> byDay = new LinkedHashMap<>();
        for (LocalDate d = startDay; !d.isAfter(endDay); d = d.plusDays(1)) {
            byDay.put(d, 0L);
        }
        for (Order o : paidInRange) {
            if (o.getCreatedAt() == null || o.getTotalAmount() == null) {
                continue;
            }
            LocalDate bucket = o.getCreatedAt().atZone(REPORT_ZONE).toLocalDate();
            if (bucket.isBefore(startDay) || bucket.isAfter(endDay)) {
                continue;
            }
            byDay.merge(bucket, o.getTotalAmount(), Long::sum);
        }
        List<DailyRevenuePointDto> out = new ArrayList<>(byDay.size());
        for (Map.Entry<LocalDate, Long> e : byDay.entrySet()) {
            LocalDate d = e.getKey();
            out.add(new DailyRevenuePointDto(d.toString(), d.format(LABEL_FMT), e.getValue()));
        }
        return out;
    }

    private List<ShoeSizeStockShareDto> buildStockSharesByShoeSize() {
        List<Object[]> rows = productSizeStockRepository.sumQuantityGroupedByShoeSize();
        List<ShoeSizeStockShareDto> raw = new ArrayList<>();
        long sumAll = 0L;
        for (Object[] row : rows) {
            int size = ((Number) row[0]).intValue();
            long qty = row[1] instanceof Number n ? n.longValue() : 0L;
            raw.add(new ShoeSizeStockShareDto(size, qty, 0.0));
            sumAll += qty;
        }
        if (sumAll <= 0) {
            return raw;
        }
        List<ShoeSizeStockShareDto> withPct = new ArrayList<>();
        for (ShoeSizeStockShareDto c : raw) {
            double pct = BigDecimal.valueOf(c.getQuantity())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(sumAll), 2, RoundingMode.HALF_UP)
                    .doubleValue();
            withPct.add(new ShoeSizeStockShareDto(c.getShoeSize(), c.getQuantity(), pct));
        }
        return withPct;
    }
}
