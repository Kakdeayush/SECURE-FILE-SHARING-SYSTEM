package com.secureshare.controller;

import com.secureshare.dto.ApiResponse;
import com.secureshare.dto.AuthDTOs;
import com.secureshare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final AuthService authService;

    /**
     * GET /api/profile
     * Returns: { success, data: { id, name, email, role, organization, createdAt } }
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        AuthDTOs.UserProfileResponse profile = authService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved.", profile));
    }

    /**
     * PUT /api/profile
     * Body: { name, organization? }
     * Returns: { success, message, data: updated profile }
     */
    @PutMapping
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AuthDTOs.UpdateProfileRequest request) {

        AuthDTOs.UserProfileResponse updated = authService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully.", updated));
    }
}
