package com.final_project.versioncontrolservice.controller;

import com.final_project.versioncontrolservice.dto.AuthResponse;
import com.final_project.versioncontrolservice.dto.LoginRequest;
import com.final_project.versioncontrolservice.dto.RefreshTokenRequest;
import com.final_project.versioncontrolservice.dto.SignupRequest;
import com.final_project.versioncontrolservice.service.AuthService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@AllArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping(path = "/auth/register", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> register(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping(path = "/auth/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
       return ResponseEntity.ok(authService.login(request));
    }
    @PostMapping(path = "/auth/refresh", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest refreshToken) {
        log.info("Refresh Token: {}", refreshToken.getRefreshToken());
        return ResponseEntity.ok(authService.refresh(refreshToken));
    }


}
