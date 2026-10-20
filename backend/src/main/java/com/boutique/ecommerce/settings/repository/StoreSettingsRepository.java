package com.boutique.ecommerce.settings.repository;

import com.boutique.ecommerce.settings.entity.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
}
