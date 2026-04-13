package com.secureshare.controller;

import com.secureshare.dto.ApiResponse;
import com.secureshare.dto.FileDTOs;
import com.secureshare.entity.FileEntity;
import com.secureshare.service.FileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicDownloadController {

    private final FileService fileService;

    /**
     * GET /api/public/info/{token}
     * Returns file metadata for the public download page.
     * No authentication required.
     * Returns: { success, data: { name, size, owner, expiresIn, passwordProtected, remainingDownloads } }
     */
    @GetMapping("/info/{token}")
    public ResponseEntity<ApiResponse<FileDTOs.PublicFileInfo>> getFileInfo(
            @PathVariable String token) {

        FileDTOs.PublicFileInfo info = fileService.getPublicFileInfo(token);
        return ResponseEntity.ok(ApiResponse.success("File info retrieved.", info));
    }

    /**
     * GET /api/public/download/{token}?password=xxx
     * Validates token, checks password, increments download count, streams decrypted file.
     * No authentication required.
     */
    @GetMapping("/download/{token}")
    public void downloadFile(
            @PathVariable String token,
            @RequestParam(value = "password", required = false) String password,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        String ipAddress = extractClientIp(request);

        // Validate and retrieve file entity (also increments download count)
        FileEntity file = fileService.prepareDownload(token, password, ipAddress);

        // Set response headers for file download
        String encodedName = URLEncoder.encode(file.getOriginalName(), StandardCharsets.UTF_8)
                .replace("+", "%20");

        response.setContentType(determineContentType(file));
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + file.getOriginalName() + "\"; filename*=UTF-8''" + encodedName);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
        response.setHeader(HttpHeaders.PRAGMA, "no-cache");

        // Stream decrypted content directly to HTTP response
        try {
            fileService.streamDecryptedFile(file, response.getOutputStream());
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("Error streaming file for token {}: {}", token, e.getMessage(), e);
            if (!response.isCommitted()) {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                        "Failed to serve file.");
            }
        }
    }

    /**
     * POST /api/public/verify-password/{token}
     * Verifies password for a protected file WITHOUT triggering a download.
     * Returns file info if password is correct.
     */
    @PostMapping("/verify-password/{token}")
    public ResponseEntity<ApiResponse<FileDTOs.PublicFileInfo>> verifyPassword(
            @PathVariable String token,
            @RequestBody(required = false) PasswordRequest body,
            HttpServletRequest request) {

        String ipAddress = extractClientIp(request);
        String password = body != null ? body.getPassword() : null;

        // getPublicFileInfo does basic validation; prepareDownload would check password
        // We do a lightweight check here without incrementing the counter
        FileDTOs.PublicFileInfo info = fileService.getPublicFileInfo(token);

        if (info.isPasswordProtected()) {
            // We need a password
            if (password == null || password.isBlank()) {
                return ResponseEntity.status(401)
                        .body(ApiResponse.error("Password is required."));
            }
            // Validate without counting — re-use prepareDownload logic is heavier
            // For verify-only, we delegate to service with a flag
            fileService.verifyPasswordOnly(token, password, ipAddress);
        }

        return ResponseEntity.ok(ApiResponse.success("Access granted.", info));
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String determineContentType(FileEntity file) {
        if (file.getContentType() != null && !file.getContentType().isBlank()) {
            return file.getContentType();
        }
        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }

    // Inner DTO for password body
    public static class PasswordRequest {
        private String password;
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
