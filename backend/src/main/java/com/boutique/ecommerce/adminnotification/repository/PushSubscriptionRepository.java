package com.boutique.ecommerce.adminnotification.repository;

import com.boutique.ecommerce.adminnotification.entity.PushSubscription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpointHash(String endpointHash);

    List<PushSubscription> findByEnabledTrue();

    boolean existsByAdminIdAndEnabledTrue(Long adminId);
}
