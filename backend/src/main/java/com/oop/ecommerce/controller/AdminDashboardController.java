package com.oop.ecommerce.controller;

import com.oop.ecommerce.dto.AdminDashboardStatsDto;
import com.oop.ecommerce.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API tách biệt cho dashboard admin — GET-only, bảo vệ bằng @PreAuthorize (không đổi SecurityFilterChain).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminDashboardStatsDto dashboardStats() {
        return adminDashboardService.getDashboardStats();
    }
}
