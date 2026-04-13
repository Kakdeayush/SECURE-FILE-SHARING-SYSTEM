package com.secureshare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @Column(name = "encrypted_key")
    private String encryptedKey;

    @Column(name = "expiry_time")
    private LocalDateTime expiryTime;

    @Column(name = "max_downloads")
    private Integer maxDownloads;

    @Column(name = "current_downloads", nullable = false)
    @Builder.Default
    private Integer currentDownloads = 0;

    @Column(name = "password")
    private String password; // BCrypt hashed if set

    @Column(name = "is_password_protected", nullable = false)
    @Builder.Default
    private Boolean isPasswordProtected = false;

    @CreationTimestamp
    @Column(name = "upload_date", updatable = false)
    private LocalDateTime uploadDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccessLog> accessLogs;

    /**
     * Determine effective status of this file.
     */
    public String getStatus() {
        boolean expired = expiryTime != null && LocalDateTime.now().isAfter(expiryTime);
        boolean limitReached = maxDownloads != null && currentDownloads >= maxDownloads;
        return (expired || limitReached) ? "Expired" : "Active";
    }
}
