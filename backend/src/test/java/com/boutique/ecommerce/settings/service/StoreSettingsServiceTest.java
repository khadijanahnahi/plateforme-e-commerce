package com.boutique.ecommerce.settings.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.boutique.ecommerce.settings.entity.StoreSettings;
import com.boutique.ecommerce.settings.repository.StoreSettingsRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StoreSettingsServiceTest {

    @Mock
    private StoreSettingsRepository storeSettingsRepository;

    @InjectMocks
    private StoreSettingsService storeSettingsService;

    @Test
    void zeroThresholdDisablesFreeDelivery() {
        mockSettings("5.00", "0.00");

        BigDecimal deliveryFee = storeSettingsService.calculateDeliveryFee(new BigDecimal("397.94"));

        assertThat(deliveryFee).isEqualByComparingTo("5.00");
    }

    @Test
    void positiveThresholdMakesEligibleOrdersFree() {
        mockSettings("5.00", "300.00");

        assertThat(storeSettingsService.calculateDeliveryFee(new BigDecimal("299.99")))
                .isEqualByComparingTo("5.00");
        assertThat(storeSettingsService.calculateDeliveryFee(new BigDecimal("300.00")))
                .isEqualByComparingTo("0.00");
    }

    private void mockSettings(String deliveryFee, String freeDeliveryThreshold) {
        StoreSettings settings = StoreSettings.builder()
                .id(StoreSettings.GLOBAL_SETTINGS_ID)
                .deliveryFee(new BigDecimal(deliveryFee))
                .freeDeliveryThreshold(new BigDecimal(freeDeliveryThreshold))
                .build();
        when(storeSettingsRepository.findById(StoreSettings.GLOBAL_SETTINGS_ID))
                .thenReturn(Optional.of(settings));
    }
}
