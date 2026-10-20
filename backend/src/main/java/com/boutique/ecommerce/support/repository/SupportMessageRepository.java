package com.boutique.ecommerce.support.repository;

import com.boutique.ecommerce.support.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long>, JpaSpecificationExecutor<SupportMessage> {

    long countByStatus(com.boutique.ecommerce.support.entity.SupportMessageStatus status);
}
