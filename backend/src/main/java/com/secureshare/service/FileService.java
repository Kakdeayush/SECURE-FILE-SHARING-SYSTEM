package com.secureshare.service;

import com.secureshare.dto.FileDTOs;
import com.secureshare.entity.AccessLog;
import com.secureshare.entity.FileEntity;
import com.secureshare.entity.User;
import com.secureshare.exception.FileLinkException;
import com.secureshare.exception.InvalidPasswordException;
import com.secureshare.exception.ResourceNotFoundException;
import com.secureshare.exception.UnauthorizedException;
import com.secureshare.repository.AccessLogRepository;
import com.secureshare.repository.FileRepository;
import com.secureshare.repository.UserRepository;
import com.secureshare.util.AesEncryptionUtil;
import com.secureshare.util.FormatUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final AccessLogRepository accessLogRepository;
    private final AesEncryptionUtil aesEncryptionUtil;
    private final PasswordEncoder passwordEncoder;
    private final Path uploadPath;

    @Value("${app.aes.secret-key}")
    private String aesKey;

    // ─────────────────────────────────────────────
    // UPLOAD
    // ─────────────────────────────────────────────

    @Transactional
    public FileDTOs.UploadResponse uploadFile(MultipartFile multipartFile,
                                               Integer expiryDays,
                                               Integer downloadLimit,
                                               String rawPassword,
                                               String userEmail) {
        User user = getUser(userEmail);

        // 1. Save original file to a temp location
        String originalName = multipartFile.getOriginalFilename() != null
                ? multipartFile.getOriginalFilename() : "uploaded_file";
        String uuid = UUID.randomUUID().toString();
        String encryptedFileName = uuid + ".enc";

        Path tempPath = uploadPath.resolve(uuid + "_temp");
        Path encryptedPath = uploadPath.resolve(encryptedFileName);

        try {
            // Write multipart bytes to temp file
            multipartFile.transferTo(tempPath.toFile());

            // 2. Encrypt the file using AES
            aesEncryptionUtil.encryptFile(tempPath, encryptedPath);

            // 3. Remove temp file
            Files.deleteIfExists(tempPath);
        } catch (Exception e) {
            log.error("File encryption failed: {}", e.getMessage(), e);
            // Cleanup on failure
            try { Files.deleteIfExists(tempPath); } catch (Exception ignored) {}
            try { Files.deleteIfExists(encryptedPath); } catch (Exception ignored) {}
            throw new RuntimeException("File upload failed due to encryption error.");
        }

        // 4. Compute expiry
        LocalDateTime expiryTime = null;
        if (expiryDays != null && expiryDays > 0) {
            expiryTime = LocalDateTime.now().plusDays(expiryDays);
        }

        // 5. Hash password if provided
        String hashedPassword = null;
        boolean isPasswordProtected = false;
        if (rawPassword != null && !rawPassword.isBlank()) {
            hashedPassword = passwordEncoder.encode(rawPassword);
            isPasswordProtected = true;
        }

        // 6. Generate unique share token
        String token = UUID.randomUUID().toString().replace("-", "");

        // 7. Save metadata to DB
        FileEntity fileEntity = FileEntity.builder()
                .fileName(encryptedFileName)
                .originalName(originalName)
                .filePath(encryptedPath.toString())
                .fileSize(multipartFile.getSize())
                .contentType(multipartFile.getContentType())
                .token(token)
                .encryptedKey(aesEncryptionUtil.getEncodedKey())
                .expiryTime(expiryTime)
                .maxDownloads(downloadLimit)
                .currentDownloads(0)
                .password(hashedPassword)
                .isPasswordProtected(isPasswordProtected)
                .user(user)
                .build();

        FileEntity saved = fileRepository.save(fileEntity);
        log.info("File uploaded: {} by user: {}", originalName, userEmail);

        return FileDTOs.UploadResponse.builder()
                .id(saved.getId())
                .token(token)
                .fileName(originalName)
                .size(FormatUtil.formatFileSize(multipartFile.getSize()))
                .build();
    }

    // ─────────────────────────────────────────────
    // LIST FILES
    // ─────────────────────────────────────────────

    public List<FileDTOs.FileResponse> getFilesForUser(String userEmail) {
        User user = getUser(userEmail);
        List<FileEntity> files = fileRepository.findByUserOrderByUploadDateDesc(user);
        return files.stream().map(this::toFileResponse).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────

    @Transactional
    public void deleteFile(Long fileId, String userEmail) {
        User user = getUser(userEmail);
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with id: " + fileId));

        if (!file.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You do not have permission to delete this file.");
        }

        // Delete physical encrypted file
        try {
            Files.deleteIfExists(Path.of(file.getFilePath()));
        } catch (Exception e) {
            log.warn("Could not delete physical file {}: {}", file.getFilePath(), e.getMessage());
        }

        fileRepository.delete(file);
        log.info("File deleted: id={} by user={}", fileId, userEmail);
    }

    // ─────────────────────────────────────────────
    // PUBLIC FILE INFO (no auth)
    // ─────────────────────────────────────────────

    public FileDTOs.PublicFileInfo getPublicFileInfo(String token) {
        FileEntity file = fileRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Link is invalid or has been removed."));

        validateFileAccess(file); // throws if expired / limit exceeded

        Integer remaining = null;
        if (file.getMaxDownloads() != null) {
            remaining = file.getMaxDownloads() - file.getCurrentDownloads();
        }

        return FileDTOs.PublicFileInfo.builder()
                .name(file.getOriginalName())
                .size(FormatUtil.formatFileSize(file.getFileSize() != null ? file.getFileSize() : 0))
                .owner(file.getUser().getName())
                .expiresIn(FormatUtil.formatExpiryTime(file.getExpiryTime()))
                .passwordProtected(Boolean.TRUE.equals(file.getIsPasswordProtected()))
                .remainingDownloads(remaining)
                .build();
    }

    // ─────────────────────────────────────────────
    // PUBLIC DOWNLOAD (no auth)
    // ─────────────────────────────────────────────

    @Transactional
    public FileEntity prepareDownload(String token, String providedPassword, String ipAddress) {
        FileEntity file = fileRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Link is invalid or has been removed."));

        // Validate access rules
        validateFileAccess(file);

        // Check password if protected
        if (Boolean.TRUE.equals(file.getIsPasswordProtected())) {
            if (providedPassword == null || providedPassword.isBlank()) {
                logAccess(file, ipAddress, "Failed - Password Required", "DOWNLOAD");
                throw new InvalidPasswordException("This file requires a password.");
            }
            if (!passwordEncoder.matches(providedPassword, file.getPassword())) {
                logAccess(file, ipAddress, "Failed - Wrong Password", "DOWNLOAD");
                throw new InvalidPasswordException("Incorrect password. Please try again.");
            }
        }

        // Increment download count atomically
        file.setCurrentDownloads(file.getCurrentDownloads() + 1);
        fileRepository.save(file);

        // Log successful access
        logAccess(file, ipAddress, "Success", "DOWNLOAD");

        return file;
    }

    // ─────────────────────────────────────────────
    // VERIFY PASSWORD (without triggering download)
    // ─────────────────────────────────────────────

    public void verifyPasswordOnly(String token, String providedPassword, String ipAddress) {
        FileEntity file = fileRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Link is invalid or has been removed."));

        validateFileAccess(file);

        if (Boolean.TRUE.equals(file.getIsPasswordProtected())) {
            if (!passwordEncoder.matches(providedPassword, file.getPassword())) {
                logAccess(file, ipAddress, "Failed - Wrong Password", "VIEW");
                throw new InvalidPasswordException("Incorrect password. Please try again.");
            }
        }
        logAccess(file, ipAddress, "Success", "VIEW");
    }

    public void streamDecryptedFile(FileEntity file, OutputStream outputStream) {
        try {
            aesEncryptionUtil.decryptFileToStream(Path.of(file.getFilePath()), outputStream);
        } catch (Exception e) {
            log.error("Decryption error for file {}: {}", file.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to decrypt and serve file.");
        }
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private void validateFileAccess(FileEntity file) {
        // Check expiry
        if (file.getExpiryTime() != null && LocalDateTime.now().isAfter(file.getExpiryTime())) {
            throw new FileLinkException("This link has expired.");
        }
        // Check download limit
        if (file.getMaxDownloads() != null && file.getCurrentDownloads() >= file.getMaxDownloads()) {
            throw new FileLinkException("The download limit for this file has been reached.");
        }
    }

    private void logAccess(FileEntity file, String ipAddress, String status, String action) {
        AccessLog log = AccessLog.builder()
                .file(file)
                .accessTime(LocalDateTime.now())
                .ipAddress(ipAddress)
                .status(status)
                .action(action)
                .build();
        accessLogRepository.save(log);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public FileDTOs.FileResponse toFileResponse(FileEntity file) {
        String expiry = file.getExpiryTime() != null
                ? FormatUtil.formatDate(file.getExpiryTime()) : "N/A";

        return FileDTOs.FileResponse.builder()
                .id(file.getId())
                .name(file.getOriginalName())
                .size(FormatUtil.formatFileSize(file.getFileSize() != null ? file.getFileSize() : 0))
                .sizeBytes(file.getFileSize())
                .uploadDate(FormatUtil.formatDate(file.getUploadDate()))
                .downloads(file.getCurrentDownloads())
                .expiry(expiry)
                .status(file.getStatus())
                .token(file.getToken())
                .passwordProtected(Boolean.TRUE.equals(file.getIsPasswordProtected()))
                .maxDownloads(file.getMaxDownloads())
                .contentType(file.getContentType())
                .build();
    }
}
