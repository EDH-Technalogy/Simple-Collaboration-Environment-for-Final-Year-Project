package com.final_project.auth_service.controller;

import com.final_project.auth_service.config.RemoteIP;
import com.final_project.auth_service.dto.*;
import com.final_project.auth_service.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for authentication endpoints.
 *
 * Provides endpoints for:
 * - User login with email/username and password
 * - User signup/registration
 * - Google OAuth2 "Sign in with Google"
 * - Token management (refresh, verify)
 * - Password management (change, reset, forgot)
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Endpoints for authentication, login, signup, and password management")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    /**
     * Login user with email/username and password.
     *
     * @param request Login request with credentials
     * @return Auth response with tokens
     */
    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Login with email/username and password")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid credentials"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Account disabled or locked"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for: {}", request.getUsernameOrEmail());
        AuthResponse response = authenticationService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Register new user (signup).
     *
     * @param request Signup request
     * @return Auth response with tokens
     */
    @PostMapping("/signup")
    @Operation(summary = "Register new user", description = "Create a new user account with email and password")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Signup successful", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or validation error"),
            @ApiResponse(responseCode = "409", description = "Email or username already exists")
    })
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        log.info("Signup request for: {}", request.getEmail());
        AuthResponse response = authenticationService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Login with Google OAuth2 (Sign in with Google).
     *
     * Frontend flow:
     * 1. User clicks "Sign in with Google"
     * 2. Google authenticates user and returns ID token
     * 3. Frontend sends ID token to this endpoint
     * 4. Server verifies token and returns access token
     *
     * @param request Google OAuth2 request with ID token
     * @return Auth response with tokens
     */
    @PostMapping("/google")
    @Operation(summary = "Sign in with Google", description = "Authenticate using Google OAuth2 ID token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Google authentication successful", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or missing ID token"),
            @ApiResponse(responseCode = "401", description = "Google token verification failed")
    })
    public ResponseEntity<AuthResponse> googleOAuth2Login(@Valid @RequestBody GoogleOAuth2Request request) {
        log.info("Google OAuth2 login request");
        AuthResponse response = authenticationService.googleOAuth2Login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Refresh access token.
     *
     * @param request Refresh token request
     * @return New auth response with refreshed access token
     */
    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh access token", description = "Get a new access token using refresh token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Token refresh request");
        AuthResponse response = authenticationService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Change user password (requires authentication).
     *
     * @param userId User ID
     * @param request Change password request
     * @return Success response
     */
    @PostMapping("/change-password/{userId}")
    @SecurityRequirement(name = "Bearer Token")
    @Operation(summary = "Change password", description = "Change user password (requires current password)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password changed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable String userId,
            @Valid @RequestBody ChangePasswordRequest request,
            @RemoteIP String ip
            ) {
        log.info("Change password request for user: {}", userId);

        request.setIpAddress(ip);
        authenticationService.changePassword(userId, request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    /**
     * Request password reset (forgot password).
     *
     * @param request Forgot password request
     * @return Success response
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Request password reset email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset email sent"),
            @ApiResponse(responseCode = "404", description = "Email not found")
    })
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,  @RemoteIP String ip) {
        log.info("Forgot password request for: {}", request.getEmail());
        request.setIp(ip);
        authenticationService.forgotPassword(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset email sent. Check your email for instructions");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    /**
     * Reset password with token from email.
     *
     * @param request Reset password request with token
     * @return Success response
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset password using token from email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or mismatched passwords"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired reset token")
    })
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Password reset request");
        authenticationService.resetPassword(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset successfully");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    /**
     * Verify email with token.
     *
     * @param request Email verification request with token
     * @return Success response
     */
    @PostMapping("/verify-email")
    @Operation(summary = "Verify email", description = "Verify email using token from verification email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email verified successfully"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired verification token")
    })
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody EmailVerificationRequest request) {
        log.info("Email verification request");
        authenticationService.verifyEmail(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Email verified successfully");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    /**
     * Resend verification email.
     *
     * @param request Resend verification email request
     * @return Success response
     */
    @PostMapping("/resend-verification-email")
    @Operation(summary = "Resend verification email", description = "Resend email verification token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Verification email sent"),
            @ApiResponse(responseCode = "404", description = "Email not found")
    })
    public ResponseEntity<Map<String, String>> resendVerificationEmail(
            @Valid @RequestBody ResendVerificationEmailRequest request) {
        log.info("Resend verification email request for: {}", request.getEmail());
        authenticationService.resendVerificationEmail(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Verification email sent. Check your email");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    /**
     * Logout user.
     *
     * @return Success response
     */
    @PostMapping("/logout")
    @PreAuthorize("hasAnyRole('FACULTY_USER', 'OPERATOR', 'PLATFORM_ADMIN')")
    @SecurityRequirement(name = "Bearer Token")
    @Operation(summary = "Logout user", description = "Logout and invalidate token on client side")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Logout successful"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal Jwt jwt
            ) {
        String id = jwt.getSubject();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful. Please clear the token on client side");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    /**
     * Check login status and get current user info.
     *
     * @return Current user information
     */
    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Token")
    @Operation(summary = "Get current user", description = "Get information about currently authenticated user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User information retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", true);
        response.put("sub", jwt.getSubject());
        response.put("username", jwt.getClaimAsString("preferred_username"));
        response.put("email", jwt.getClaimAsString("email"));
        response.put("emailVerified", jwt.getClaim("email_verified"));
        response.put("realmRoles", extractRealmRoles(jwt));
        response.put("resourceAccess", jwt.getClaim("resource_access"));

        response.put("status", "authenticated");

        return ResponseEntity.ok(response);
    }
    private List<String> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return List.of();
        }
        Object roles = realmAccess.get("roles");
        if (roles instanceof Collection<?> collection) {
            return collection.stream().map(Object::toString).toList();
        }
        return List.of();
    }
}
