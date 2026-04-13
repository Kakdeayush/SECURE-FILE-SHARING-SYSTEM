package com.secureshare.service;

import com.secureshare.dto.AnalyticsDTOs;
import com.secureshare.entity.AccessLog;
import com.secureshare.entity.User;
import com.secureshare.exception.ResourceNotFoundException;
import com.secureshare.repository.AccessLogRepository;
import com.secureshare.repository.FileRepository;
import com.secureshare.repository.UserRepository;
import com.secureshare.util.FormatUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final FileRepository fileRepository;
    private final AccessLogRepository accessLogRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter CHART_DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM d");

    // ─────────────────────────────────────────────
    // DASHBOARD STATS
    // ─────────────────────────────────────────────

    public AnalyticsDTOs.DashboardStats getDashboardStats(String userEmail) {
        User user = getUser(userEmail);

        long totalFiles = fileRepository.countByUser(user);
        Long downloads = fileRepository.sumDownloadsByUser(user);
        long totalDownloads = downloads != null ? downloads : 0L;
        long activeLinks = fileRepository.countActiveFilesByUser(user);

        return AnalyticsDTOs.DashboardStats.builder()
                .totalFiles(totalFiles)
                .totalDownloads(totalDownloads)
                .activeLinks(activeLinks)
                .build();
    }

    // ─────────────────────────────────────────────
    // FULL ANALYTICS PAGE DATA
    // ─────────────────────────────────────────────

    public AnalyticsDTOs.AnalyticsSummary getAnalytics(String userEmail) {
        User user = getUser(userEmail);

        // Total downloads
        Long downloads = fileRepository.sumDownloadsByUser(user);
        long totalDownloads = downloads != null ? downloads : 0L;

        // Unique visitors (distinct IPs)
        long uniqueVisitors = accessLogRepository.countUniqueVisitorsByUser(user);

        // Blocked attempts
        long blockedAttempts = accessLogRepository.countFailedAttemptsByUser(user);

        // Chart data: last 7 days
        List<AnalyticsDTOs.ChartDataPoint> chartData = buildChartData(user);

        // Recent access logs (last 10)
        List<AccessLog> recentLogs = accessLogRepository.findTop10ByFileUserOrderByAccessTimeDesc(user);
        List<AnalyticsDTOs.AccessLogEntry> logEntries = recentLogs.stream()
                .map(this::toLogEntry)
                .collect(Collectors.toList());

        return AnalyticsDTOs.AnalyticsSummary.builder()
                .totalDownloads(totalDownloads)
                .uniqueVisitors(uniqueVisitors)
                .blockedAttempts(blockedAttempts)
                .chartData(chartData)
                .recentLogs(logEntries)
                .build();
    }

    // ─────────────────────────────────────────────
    // RECENT ACTIVITY (for dashboard)
    // ─────────────────────────────────────────────

    public List<AnalyticsDTOs.RecentActivityEntry> getRecentActivity(String userEmail) {
        User user = getUser(userEmail);
        List<AccessLog> logs = accessLogRepository.findTop10ByFileUserOrderByAccessTimeDesc(user);

        return logs.stream()
                .map(log -> AnalyticsDTOs.RecentActivityEntry.builder()
                        .id(log.getId())
                        .action(mapActionLabel(log.getAction(), log.getStatus()))
                        .file(log.getFile().getOriginalName())
                        .time(FormatUtil.formatRelativeTime(log.getAccessTime()))
                        .build())
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private List<AnalyticsDTOs.ChartDataPoint> buildChartData(User user) {
        LocalDateTime since = LocalDateTime.now().minusDays(6).withHour(0).withMinute(0).withSecond(0);

        // Fetch raw counts from DB grouped by date
        List<Object[]> downloadRows = accessLogRepository.findDailyDownloadsByUser(user, since);
        List<Object[]> viewRows = accessLogRepository.findDailyViewsByUser(user, since);

        // Build maps: date string → count
        Map<String, Long> downloadMap = new LinkedHashMap<>();
        for (Object[] row : downloadRows) {
            String dateKey = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            downloadMap.put(dateKey, count);
        }

        Map<String, Long> viewMap = new LinkedHashMap<>();
        for (Object[] row : viewRows) {
            String dateKey = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            viewMap.put(dateKey, count);
        }

        // Build a complete list for last 7 days
        List<AnalyticsDTOs.ChartDataPoint> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dateKey = date.toString(); // "yyyy-MM-dd"
            String label = date.format(CHART_DATE_FORMATTER); // "Apr 1"

            long dlCount = downloadMap.getOrDefault(dateKey, 0L);
            long viewCount = viewMap.getOrDefault(dateKey, 0L);

            result.add(AnalyticsDTOs.ChartDataPoint.builder()
                    .date(label)
                    .downloads(dlCount)
                    .uniqueViews(viewCount)
                    .build());
        }
        return result;
    }

    private AnalyticsDTOs.AccessLogEntry toLogEntry(AccessLog log) {
        return AnalyticsDTOs.AccessLogEntry.builder()
                .id(log.getId())
                .file(log.getFile().getOriginalName())
                .ip(log.getIpAddress() != null ? log.getIpAddress() : "Unknown")
                .time(FormatUtil.formatRelativeTime(log.getAccessTime()))
                .status(log.getStatus())
                .action(log.getAction())
                .build();
    }

    private String mapActionLabel(String action, String status) {
        if ("DOWNLOAD".equals(action) && "Success".equals(status)) return "File Downloaded";
        if ("DOWNLOAD".equals(action)) return "Download Attempt";
        return "File Accessed";
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
