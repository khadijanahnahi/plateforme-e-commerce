package com.boutique.ecommerce.adminnotification.service;

import com.boutique.ecommerce.adminnotification.config.WebPushProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class PushSubscriptionCrypto {

    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private final SecureRandom secureRandom = new SecureRandom();
    private final WebPushProperties properties;

    public PushSubscriptionCrypto(WebPushProperties properties) {
        this.properties = properties;
    }

    public String encrypt(String value) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            byte[] payload = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(ciphertext, 0, payload, iv.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(payload);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to protect the push subscription.", exception);
        }
    }

    public String decrypt(String encryptedValue) {
        try {
            byte[] payload = Base64.getDecoder().decode(encryptedValue);
            if (payload.length <= IV_LENGTH) {
                throw new IllegalArgumentException("Invalid encrypted push subscription.");
            }
            byte[] iv = new byte[IV_LENGTH];
            byte[] ciphertext = new byte[payload.length - IV_LENGTH];
            System.arraycopy(payload, 0, iv, 0, IV_LENGTH);
            System.arraycopy(payload, IV_LENGTH, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new IllegalStateException("Unable to read the protected push subscription.", exception);
        }
    }

    public String endpointHash(String endpoint) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(endpoint.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private SecretKey encryptionKey() {
        if (properties.storageEncryptionKey() == null || properties.storageEncryptionKey().isBlank()) {
            throw new IllegalStateException("APP_WEB_PUSH_STORAGE_ENCRYPTION_KEY is required.");
        }
        try {
            byte[] configured = Base64.getDecoder().decode(properties.storageEncryptionKey());
            if (configured.length != 32) {
                throw new IllegalStateException("APP_WEB_PUSH_STORAGE_ENCRYPTION_KEY must decode to 32 bytes.");
            }
            return new SecretKeySpec(configured, "AES");
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("APP_WEB_PUSH_STORAGE_ENCRYPTION_KEY must be Base64 encoded.", exception);
        }
    }
}
