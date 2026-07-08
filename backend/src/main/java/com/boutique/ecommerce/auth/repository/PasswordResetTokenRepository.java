package com.boutique.ecommerce.auth.repository;

import com.boutique.ecommerce.auth.entity.PasswordResetToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    @Query("""
            update PasswordResetToken token
            set token.used = true
            where token.user.id = :userId
              and token.used = false
            """)
    int markUnusedTokensAsUsedForUser(@Param("userId") Long userId);
}
