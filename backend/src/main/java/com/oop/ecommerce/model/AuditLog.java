package com.oop.ecommerce.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String entityName;

    private Long entityId;

    @Column(nullable = false)
    private String action;

    @Column(columnDefinition = "JSONB")
    private String oldValues;

    @Column(columnDefinition = "JSONB")
    private String newValues;

    private String ipAddress;
    
    @Column(columnDefinition = "TEXT")
    private String userAgent;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
