package com.boutique.ecommerce.auth.repository;

import com.boutique.ecommerce.auth.entity.RefreshTokenSession;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenSessionRepository extends JpaRepository<RefreshTokenSession, Long> {

    Optional<RefreshTokenSession> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
            update RefreshTokenSession session
            set session.revokedAt = :revokedAt
            where session.tokenHash = :tokenHash
              and session.revokedAt is null
            """)
    int revokeByTokenHash(@Param("tokenHash") String tokenHash, @Param("revokedAt") LocalDateTime revokedAt);

    @Modifying
    @Query("""
            update RefreshTokenSession session
            set session.revokedAt = :revokedAt
            where session.user.id = :userId
              and session.revokedAt is null
            """)
    int revokeActiveSessionsForUser(@Param("userId") Long userId, @Param("revokedAt") LocalDateTime revokedAt);
}
