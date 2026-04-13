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

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/analytics
     * Returns full analytics summary: totals, chart data (last 7 days), recent access logs.
     * Response: {
     *   success: true,
     *   data: {
     *     totalDownloads, uniqueVisitors, blockedAttempts,
     *     chartData: [ { date, downloads, uniqueViews } ],
     *     recentLogs: [ { id, file, ip, time, status, action } ]
     *   }
     * }
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AnalyticsDTOs.AnalyticsSummary>> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {

        AnalyticsDTOs.AnalyticsSummary summary = analyticsService.getAnalytics(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Analytics retrieved.", summary));
    }
}
