package com.secureshare.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "access_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    @Column(name = "access_time", nullable = false)
    private LocalDateTime accessTime;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "status")
    private String status; // "Success", "Failed - Wrong Password", "Failed - Expired", etc.

    @Column(name = "action")
    private String action; // "VIEW", "DOWNLOAD"
}
