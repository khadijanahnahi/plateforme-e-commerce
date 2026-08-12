package com.boutique.ecommerce.adminnotification.entity;

import com.boutique.ecommerce.common.AuditableEntity;
import com.boutique.ecommerce.user.entity.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "push_subscriptions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushSubscription extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false, foreignKey = @ForeignKey(name = "fk_push_subscription_admin"))
    private AppUser admin;

    @Column(name = "endpoint_hash", nullable = false, unique = true, length = 64)
    private String endpointHash;

    @Column(name = "endpoint_encrypted", nullable = false, columnDefinition = "text")
    private String endpointEncrypted;

    @Column(name = "p256dh_encrypted", nullable = false, columnDefinition = "text")
    private String p256dhEncrypted;

    @Column(name = "auth_encrypted", nullable = false, columnDefinition = "text")
    private String authEncrypted;

    @Column(name = "device_name", length = 120)
    private String deviceName;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "last_success_at")
    private LocalDateTime lastSuccessAt;

    @Column(name = "last_failure_at")
    private LocalDateTime lastFailureAt;
}
