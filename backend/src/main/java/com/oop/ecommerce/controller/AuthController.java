package com.oop.ecommerce.controller;

import com.oop.ecommerce.dto.AuthRequest;
import com.oop.ecommerce.dto.GoogleAuthRequest;
import com.oop.ecommerce.dto.JwtResponse;
import com.oop.ecommerce.dto.RegisterRequest;
import com.oop.ecommerce.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            authService.register(registerRequest);
            return ResponseEntity.ok("User registered successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {
        JwtResponse jwtResponse = authService.login(authRequest);
        return ResponseEntity.ok(jwtResponse);
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleAuthRequest googleAuthRequest) {
        try {
            JwtResponse jwtResponse = authService.googleLogin(googleAuthRequest);
            return ResponseEntity.ok(jwtResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
