package com.secureshare.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AnalyticsDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private long totalFiles;
        private long totalDownloads;
        private long activeLinks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyticsSummary {
        private long totalDownloads;
        private long uniqueVisitors;
        private long blockedAttempts;
        private List<ChartDataPoint> chartData;
        private List<AccessLogEntry> recentLogs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartDataPoint {
        private String date;
        private long downloads;
        private long uniqueViews;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AccessLogEntry {
        private Long id;
        private String file;
        private String ip;
        private String time;
        private String status;
        private String action;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityEntry {
        private Long id;
        private String action;
        private String file;
        private String time;
    }
}
