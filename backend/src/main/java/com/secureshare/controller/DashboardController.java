package com.secureshare.controller;

import com.secureshare.dto.AnalyticsDTOs;
import com.secureshare.dto.ApiResponse;
import com.secureshare.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/dashboard/stats
     * Returns: { success, data: { totalFiles, totalDownloads, activeLinks } }
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AnalyticsDTOs.DashboardStats>> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        AnalyticsDTOs.DashboardStats stats = analyticsService.getDashboardStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved.", stats));
    }

    /**
     * GET /api/dashboard/activity
     * Returns: { success, data: [ { id, action, file, time }, ... ] }
     */
    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<AnalyticsDTOs.RecentActivityEntry>>> getRecentActivity(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<AnalyticsDTOs.RecentActivityEntry> activity =
                analyticsService.getRecentActivity(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Recent activity retrieved.", activity));
    }
}
