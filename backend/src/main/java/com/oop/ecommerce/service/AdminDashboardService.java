package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.AdminDashboardStatsDto;
import com.oop.ecommerce.dto.CategorySalesShareDto;
import com.oop.ecommerce.dto.DailyRevenuePointDto;
import com.oop.ecommerce.model.Order;
import com.oop.ecommerce.model.OrderStatus;
import com.oop.ecommerce.repository.OrderRepository;
import com.oop.ecommerce.repository.ProductRepository;
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
        List<CategorySalesShareDto> categories = buildCategoryShares();

        return new AdminDashboardStatsDto(totalRevenue, totalProducts, itemsInStock, itemsSold, daily, categories);
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

    private List<CategorySalesShareDto> buildCategoryShares() {
        List<Object[]> rows = orderRepository.sumPaidLineRevenueByCategory();
        List<CategorySalesShareDto> raw = new ArrayList<>();
        BigDecimal sumAll = BigDecimal.ZERO;
        for (Object[] row : rows) {
            String cat = row[0] != null ? row[0].toString() : "Khác";
            BigDecimal rev = toBigDecimal(row[1]);
            raw.add(new CategorySalesShareDto(cat, rev, 0.0));
            sumAll = sumAll.add(rev);
        }
        if (sumAll.signum() == 0) {
            return raw;
        }
        List<CategorySalesShareDto> withPct = new ArrayList<>();
        for (CategorySalesShareDto c : raw) {
            double pct = c.getRevenueVnd()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(sumAll, 2, RoundingMode.HALF_UP)
                    .doubleValue();
            withPct.add(new CategorySalesShareDto(c.getCategory(), c.getRevenueVnd(), pct));
        }
        return withPct;
    }

    private static BigDecimal toBigDecimal(Object o) {
        if (o == null) {
            return BigDecimal.ZERO;
        }
        if (o instanceof BigDecimal bd) {
            return bd;
        }
        if (o instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(o.toString());
    }
}
