package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.admin.CategorySalesDto;
import com.oop.ecommerce.dto.admin.DailyRevenuePointDto;
import com.oop.ecommerce.dto.admin.DashboardStatsDto;
import com.oop.ecommerce.model.OrderStatus;
import com.oop.ecommerce.repository.OrderRepository;
import com.oop.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(int days) {
        int safeDays = Math.max(1, Math.min(days, 90));

        Long totalRevenue = orderRepository.sumTotalAmountByStatus(OrderStatus.PAID);
        Long totalProducts = productRepository.count();
        Long itemsInStock = productRepository.sumStockQuantity();
        Long itemsSold = orderRepository.sumItemsSoldByStatus(OrderStatus.PAID);

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(safeDays - 1L);
        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime toExclusive = today.plusDays(1).atStartOfDay();

        List<DailyRevenuePointDto> dailyRevenue = buildDailyRevenue(from, toExclusive);
        List<CategorySalesDto> salesByCategory = buildSalesByCategory();

        return DashboardStatsDto.builder()
                .totalRevenue(nvl(totalRevenue))
                .totalProducts(nvl(totalProducts))
                .itemsInStock(nvl(itemsInStock))
                .itemsSold(nvl(itemsSold))
                .dailyRevenue(dailyRevenue)
                .salesByCategory(salesByCategory)
                .build();
    }

    private List<DailyRevenuePointDto> buildDailyRevenue(LocalDateTime from, LocalDateTime toExclusive) {
        List<Object[]> points = orderRepository.findRevenuePointsBetween(OrderStatus.PAID, from, toExclusive);

        Map<LocalDate, Long> revenueByDate = new HashMap<>();
        for (Object[] row : points) {
            LocalDateTime createdAt = (LocalDateTime) row[0];
            Long amount = (Long) row[1];
            if (createdAt == null) continue;
            LocalDate d = createdAt.toLocalDate();
            revenueByDate.merge(d, nvl(amount), Long::sum);
        }

        List<DailyRevenuePointDto> out = new ArrayList<>();
        LocalDate cursor = from.toLocalDate();
        LocalDate end = toExclusive.minusNanos(1).toLocalDate();
        while (!cursor.isAfter(end)) {
            out.add(DailyRevenuePointDto.builder()
                    .date(cursor.toString())
                    .revenue(revenueByDate.getOrDefault(cursor, 0L))
                    .build());
            cursor = cursor.plusDays(1);
        }
        return out;
    }

    private List<CategorySalesDto> buildSalesByCategory() {
        List<Object[]> rows = orderRepository.sumSoldQuantityByCategory(OrderStatus.PAID);

        long totalQty = 0;
        List<CategorySalesDto> tmp = new ArrayList<>();
        for (Object[] row : rows) {
            String category = row[0] == null ? "Khác" : row[0].toString();
            Long qty = row[1] == null ? 0L : ((Number) row[1]).longValue();
            totalQty += qty;
            tmp.add(CategorySalesDto.builder()
                    .category(category)
                    .quantity(qty)
                    .percent(0)
                    .build());
        }

        final long denom = totalQty;
        for (CategorySalesDto item : tmp) {
            int percent = denom <= 0 ? 0 : (int) Math.round(item.getQuantity() * 100.0 / denom);
            item.setPercent(percent);
        }

        tmp.sort(Comparator.comparing(CategorySalesDto::getQuantity).reversed());
        return tmp;
    }

    private static long nvl(Long v) {
        return v == null ? 0L : v;
    }
}

