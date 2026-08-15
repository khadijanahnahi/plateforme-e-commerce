package com.boutique.ecommerce.adminnotification.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.boutique.ecommerce.adminnotification.config.WebPushProperties;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class PushSubscriptionCryptoTest {

    private static final String VALID_KEY = Base64.getEncoder()
            .encodeToString("0123456789abcdef0123456789abcdef".getBytes(StandardCharsets.UTF_8));

    @Test
    void encryptsAndDecryptsSubscriptionValues() {
        PushSubscriptionCrypto crypto = cryptoWithKey(VALID_KEY);

        String encrypted = crypto.encrypt("https://push.example/subscription/42");

        assertEquals("https://push.example/subscription/42", crypto.decrypt(encrypted));
    }

    @Test
    void usesANewInitializationVectorForEveryEncryption() {
        PushSubscriptionCrypto crypto = cryptoWithKey(VALID_KEY);

        assertNotEquals(crypto.encrypt("same-value"), crypto.encrypt("same-value"));
    }

    @Test
    void hashesEndpointsDeterministicallyWithoutStoringTheirValue() {
        PushSubscriptionCrypto crypto = cryptoWithKey(VALID_KEY);

        String firstHash = crypto.endpointHash("https://push.example/device");

        assertEquals(firstHash, crypto.endpointHash("https://push.example/device"));
        assertEquals(64, firstHash.length());
        assertNotEquals(firstHash, crypto.endpointHash("https://push.example/other-device"));
    }

    @Test
    void rejectsMissingMalformedOrIncorrectlySizedKeys() {
        IllegalStateException missing = assertThrows(
                IllegalStateException.class,
                () -> cryptoWithKey(" ").encrypt("value")
        );
        IllegalStateException malformed = assertThrows(
                IllegalStateException.class,
                () -> cryptoWithKey("not-base64!").encrypt("value")
        );
        IllegalStateException wrongSize = assertThrows(
                IllegalStateException.class,
                () -> cryptoWithKey(Base64.getEncoder().encodeToString(new byte[16])).encrypt("value")
        );

        assertTrue(missing.getMessage().contains("is required"));
        assertTrue(malformed.getMessage().contains("Base64"));
        assertTrue(wrongSize.getMessage().contains("32 bytes"));
    }

    @Test
    void rejectsTruncatedAndTamperedCiphertexts() {
        PushSubscriptionCrypto crypto = cryptoWithKey(VALID_KEY);
        String truncated = Base64.getEncoder().encodeToString(new byte[12]);
        byte[] tampered = Base64.getDecoder().decode(crypto.encrypt("protected-value"));
        tampered[tampered.length - 1] ^= 1;

        assertThrows(IllegalStateException.class, () -> crypto.decrypt(truncated));
        assertThrows(
                IllegalStateException.class,
                () -> crypto.decrypt(Base64.getEncoder().encodeToString(tampered))
        );
        assertThrows(IllegalStateException.class, () -> crypto.decrypt("not-base64!"));
    }

    private PushSubscriptionCrypto cryptoWithKey(String key) {
        return new PushSubscriptionCrypto(new WebPushProperties(
                true,
                "public-key",
                "private-key",
                "mailto:support@shopsphere.ma",
                key,
                300,
                3
        ));
    }
}
