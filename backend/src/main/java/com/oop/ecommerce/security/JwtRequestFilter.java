package com.oop.ecommerce.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtRequestFilter extends OncePerRequestFilter {

    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;

    /** PayOS server-to-server webhook has no Bearer token — skip JWT processing and noisy failures. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path != null
                && "POST".equalsIgnoreCase(request.getMethod())
                && path.endsWith("/api/payment/webhook");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authorizationHeader = request.getHeader("Authorization");

        // Check if Authorization header is missing or invalid - if so, skip JWT processing
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            log.debug("No valid Bearer token found in Authorization header for request: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        String username = null;
        String jwt = null;

        try {
            // Extract JWT token from "Bearer <token>" format
            jwt = authorizationHeader.substring(7);
            username = jwtUtil.extractUsername(jwt);
        } catch (Exception e) {
            log.debug("Unable to extract JWT token from Authorization header", e);
        }

        // Set authentication if username was successfully extracted and no authentication already exists
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                log.debug("Successfully authenticated user: {}", username);
            }
        }
        filterChain.doFilter(request, response);
    }
}
