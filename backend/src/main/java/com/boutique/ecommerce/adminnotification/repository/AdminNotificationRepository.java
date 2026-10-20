package com.boutique.ecommerce.adminnotification.repository;

import com.boutique.ecommerce.adminnotification.entity.AdminNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    Optional<AdminNotification> findByEventKey(String eventKey);

    List<AdminNotification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByReadAtIsNull();
}
