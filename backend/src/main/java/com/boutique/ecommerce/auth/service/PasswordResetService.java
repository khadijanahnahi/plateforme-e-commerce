package com.boutique.ecommerce.auth.service;

import com.boutique.ecommerce.auth.dto.ForgotPasswordRequest;
import com.boutique.ecommerce.auth.dto.MessageResponse;
import com.boutique.ecommerce.auth.dto.ResetPasswordRequest;
import com.boutique.ecommerce.auth.entity.PasswordResetToken;
import com.boutique.ecommerce.auth.repository.PasswordResetTokenRepository;
import com.boutique.ecommerce.config.AppFrontendProperties;
import com.boutique.ecommerce.notification.AppEmailProperties;
import com.boutique.ecommerce.notification.EmailService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final String GENERIC_MESSAGE =
            "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.";
    private static final String INVALID_TOKEN_MESSAGE = "Lien de reinitialisation invalide ou expire.";
    private static final int TOKEN_EXPIRATION_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AppEmailProperties emailProperties;
    private final AppFrontendProperties frontendProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AppEmailProperties emailProperties,
            AppFrontendProperties frontendProperties
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.emailProperties = emailProperties;
        this.frontendProperties = frontendProperties;
    }

    @Transactional
    public MessageResponse requestPasswordReset(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        userRepository.findByEmailIgnoreCase(email).ifPresentOrElse(
                this::createTokenAndSendEmail,
                () -> log.info("password reset requested for non-existing account")
        );

        return new MessageResponse(GENERIC_MESSAGE);
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        validatePasswordResetRequest(request);

        PasswordResetToken resetToken = tokenRepository.findByToken(request.token())
                .orElseThrow(() -> new IllegalArgumentException(INVALID_TOKEN_MESSAGE));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(INVALID_TOKEN_MESSAGE);
        }

        AppUser user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        resetToken.setUsed(true);

        userRepository.save(user);
        tokenRepository.save(resetToken);
        log.info("password reset completed userId={}", user.getId());

        return new MessageResponse("Votre mot de passe a ete reinitialise.");
    }

    private void createTokenAndSendEmail(AppUser user) {
        tokenRepository.markUnusedTokensAsUsedForUser(user.getId());

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(generateSecureToken());
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRATION_MINUTES));
        tokenRepository.save(resetToken);

        if (!emailProperties.isEnabled()) {
            log.info("password reset email skipped emailEnabled=false userId={}", user.getId());
            return;
        }

        if (!emailService.isConfigured()) {
            log.warn("password reset email skipped mailSenderNotConfigured userId={}", user.getId());
            return;
        }

        try {
            emailService.sendHtml(
                    user.getEmail(),
                    "Reinitialisation de votre mot de passe ShopSphere",
                    buildPasswordResetEmailHtml(user, resetToken.getToken())
            );
            log.info("password reset email sent userId={}", user.getId());
        } catch (Exception exception) {
            log.error("password reset email failed userId={} reason={}", user.getId(), exception.getMessage());
        }
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void validatePasswordResetRequest(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Les mots de passe ne correspondent pas.");
        }

        String password = request.newPassword();
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);

        if (!hasLowercase || !hasUppercase || !hasDigit) {
            throw new IllegalArgumentException(
                    "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre."
            );
        }
    }

    private String buildPasswordResetEmailHtml(AppUser user, String token) {
        String resetUrl = normalizedFrontendUrl()
                + "/reset-password?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
        String customerName = escapeHtml(user.getFullName());

        return """
                <!doctype html>
                <html lang="fr">
                <head>
                  <meta charset="UTF-8">
                  <title>Reinitialisation mot de passe</title>
                </head>
                <body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#111111;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;padding:32px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5ded2;border-radius:24px;overflow:hidden;">
                          <tr>
                            <td style="padding:28px 32px;background:#111111;color:#ffffff;">
                              <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;">ShopSphere</div>
                              <div style="margin-top:8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#d8d0c2;">Support securise</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:34px 32px;">
                              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.05;color:#111111;">Reinitialiser votre mot de passe</h1>
                              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#4f4a43;">Bonjour %s,</p>
                              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#4f4a43;">Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe.</p>
                              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                                <tr>
                                  <td style="background:#111111;border-radius:999px;">
                                    <a href="%s" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">Reinitialiser mon mot de passe</a>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#6a635a;">Ce lien expire dans 30 minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
                              <p style="margin:0;font-size:13px;line-height:1.7;color:#8a8176;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><span style="word-break:break-all;color:#111111;">%s</span></p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:22px 32px;background:#f8f5ee;border-top:1px solid #e5ded2;color:#6a635a;font-size:13px;line-height:1.6;">
                              ShopSphere Support<br>
                              Email automatique, merci de ne pas y repondre.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(customerName, resetUrl, resetUrl);
    }

    private String normalizedFrontendUrl() {
        String url = frontendProperties.getUrl();
        if (url == null || url.isBlank()) {
            return "http://localhost:5173";
        }
        return url.replaceAll("/+$", "");
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
