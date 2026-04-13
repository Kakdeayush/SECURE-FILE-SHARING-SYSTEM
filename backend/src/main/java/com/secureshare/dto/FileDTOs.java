package com.secureshare.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class FileDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FileResponse {
        private Long id;
        private String name;       // display name (originalName)
        private String size;       // human-readable size
        private Long sizeBytes;
        private String uploadDate; // formatted date string
        private Integer downloads;
        private String expiry;     // formatted or "N/A"
        private String status;     // "Active" or "Expired"
        private String token;
        private boolean passwordProtected;
        private Integer maxDownloads;
        private String contentType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PublicFileInfo {
        private String name;
        private String size;
        private String owner;
        private String expiresIn;
        private boolean passwordProtected;
        private Integer remainingDownloads;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadResponse {
        private Long id;
        private String token;
        private String shareLink;
        private String fileName;
        private String size;
    }
}
