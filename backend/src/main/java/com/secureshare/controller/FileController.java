package com.secureshare.controller;

import com.secureshare.dto.ApiResponse;
import com.secureshare.dto.FileDTOs;
import com.secureshare.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * POST /api/upload
     * Multipart form: file, expiryDays, downloadLimit?, password?
     * Returns: { success, message, data: { id, token, shareLink, fileName, size } }
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileDTOs.UploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "expiryDays", defaultValue = "7") String expiryDaysStr,
            @RequestParam(value = "downloadLimit", required = false) Integer downloadLimit,
            @RequestParam(value = "password", required = false) String password,
            @AuthenticationPrincipal UserDetails userDetails) {

        // Parse expiryDays ("never" → null, numeric → integer)
        Integer expiryDays = null;
        if (expiryDaysStr != null && !expiryDaysStr.equalsIgnoreCase("never")) {
            try {
                expiryDays = Integer.parseInt(expiryDaysStr);
            } catch (NumberFormatException ignored) {
                expiryDays = 7; // fallback default
            }
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Please select a file to upload."));
        }

        FileDTOs.UploadResponse response = fileService.uploadFile(
                file, expiryDays, downloadLimit, password, userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded and encrypted successfully.", response));
    }

    /**
     * GET /api/files
     * Returns: { success, data: [ FileResponse, ... ] }
     */
    @GetMapping("/files")
    public ResponseEntity<ApiResponse<List<FileDTOs.FileResponse>>> listFiles(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<FileDTOs.FileResponse> files = fileService.getFilesForUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Files retrieved.", files));
    }

    /**
     * DELETE /api/files/{id}
     * Returns: { success, message }
     */
    @DeleteMapping("/files/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        fileService.deleteFile(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully."));
    }
}
