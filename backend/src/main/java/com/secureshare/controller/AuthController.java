package com.secureshare.controller;

import com.secureshare.dto.ApiResponse;
import com.secureshare.dto.AuthDTOs;
import com.secureshare.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Body: { name, email, password, organization? }
     * Returns: { success, message, data: { token, id, name, email, role } }
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> register(
            @Valid @RequestBody AuthDTOs.RegisterRequest request) {

        AuthDTOs.AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully.", response));
    }

    /**
     * POST /api/auth/login
     * Body: { email, password }
     * Returns: { success, message, data: { token, id, name, email, role } }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDTOs.AuthResponse>> login(
            @Valid @RequestBody AuthDTOs.LoginRequest request) {

        AuthDTOs.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful.", response));
    }

    /**
     * POST /api/auth/forgot-password
     * Body: { email }
     * Returns: { success, message }
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        
        // Mock email sending: Just accept it and return success for user experience
        return ResponseEntity.ok(ApiResponse.success("If an account with this email exists, a password reset link has been sent.", null));
    }
}
