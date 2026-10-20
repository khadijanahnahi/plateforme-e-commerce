package com.boutique.ecommerce.adminnotification.repository;

import com.boutique.ecommerce.adminnotification.entity.AdminNotificationDelivery;
import com.boutique.ecommerce.adminnotification.entity.PushDeliveryStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminNotificationDeliveryRepository extends JpaRepository<AdminNotificationDelivery, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select d
            from AdminNotificationDelivery d
            where d.status in :statuses and d.nextAttemptAt <= :now
            order by d.nextAttemptAt asc, d.id asc
            """)
    List<AdminNotificationDelivery> findDueForUpdate(
            @Param("statuses") List<PushDeliveryStatus> statuses,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update AdminNotificationDelivery d
            set d.status = :retryStatus,
                d.nextAttemptAt = :now,
                d.lastError = :reason
            where d.status = :processingStatus and d.updatedAt < :staleBefore
            """)
    int recoverStaleProcessing(
            @Param("processingStatus") PushDeliveryStatus processingStatus,
            @Param("retryStatus") PushDeliveryStatus retryStatus,
            @Param("staleBefore") LocalDateTime staleBefore,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason
    );
}
