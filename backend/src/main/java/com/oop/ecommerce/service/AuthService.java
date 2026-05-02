package com.oop.ecommerce.service;

import com.oop.ecommerce.dto.AuthRequest;
import com.oop.ecommerce.dto.JwtResponse;
import com.oop.ecommerce.dto.RegisterRequest;
import com.oop.ecommerce.model.Role;
import com.oop.ecommerce.model.User;
import com.oop.ecommerce.repository.UserRepository;
import com.oop.ecommerce.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.oop.ecommerce.dto.GoogleAuthRequest;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Value("${google.client.id}")
    private String googleClientId;

    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        userRepository.save(user);
    }

    public JwtResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        final String jwt = jwtUtil.generateToken(userDetails);
        
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();

        return new JwtResponse(jwt, user.getUsername(), user.getEmail(), user.getRole().name());
    }

    public JwtResponse googleLogin(GoogleAuthRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();

                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    // Create new user if not exists
                    User newUser = User.builder()
                            .username(email) // using email as username to ensure uniqueness
                            .email(email)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.USER)
                            .build();
                    return userRepository.save(newUser);
                });

                final UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
                final String jwt = jwtUtil.generateToken(userDetails);

                return new JwtResponse(jwt, user.getUsername(), user.getEmail(), user.getRole().name());
            } else {
                throw new RuntimeException("Invalid Google ID token.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Authentication with Google failed: " + e.getMessage());
        }
    }
}
