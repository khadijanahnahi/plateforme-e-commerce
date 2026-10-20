package com.boutique.ecommerce.support.service;

import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.support.dto.SupportMessageRequest;
import com.boutique.ecommerce.support.dto.SupportMessageResponse;
import com.boutique.ecommerce.support.dto.UpdateSupportMessageNoteRequest;
import com.boutique.ecommerce.support.dto.UpdateSupportMessageStatusRequest;
import com.boutique.ecommerce.support.entity.SupportMessage;
import com.boutique.ecommerce.support.entity.SupportMessageStatus;
import com.boutique.ecommerce.support.repository.SupportMessageRepository;
import jakarta.persistence.criteria.Expression;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportMessageService {

    private final SupportMessageRepository supportMessageRepository;

    public SupportMessageService(SupportMessageRepository supportMessageRepository) {
        this.supportMessageRepository = supportMessageRepository;
    }

    @Transactional
    public SupportMessageResponse create(SupportMessageRequest request) {
        SupportMessage message = SupportMessage.builder()
                .fullName(normalizeRequired(request.fullName()))
                .email(normalizeRequired(request.email()).toLowerCase())
                .subject(normalizeRequired(request.subject()))
                .orderNumber(normalizeOptional(request.orderNumber()))
                .message(normalizeRequired(request.message()))
                .status(SupportMessageStatus.NEW)
                .build();
        return toResponse(supportMessageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public List<SupportMessageResponse> getMessages(
            SupportMessageStatus status,
            String search,
            LocalDateTime dateFrom,
            LocalDateTime dateTo
    ) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException("dateFrom must be before dateTo.");
        }

        Specification<SupportMessage> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (status != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            specification = specification.and((root, query, criteriaBuilder) -> {
                Expression<String> fullName = criteriaBuilder.lower(root.get("fullName"));
                Expression<String> email = criteriaBuilder.lower(root.get("email"));
                Expression<String> subject = criteriaBuilder.lower(root.get("subject"));
                Expression<String> orderNumber = criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("orderNumber"), ""));
                return criteriaBuilder.or(
                        criteriaBuilder.like(fullName, pattern),
                        criteriaBuilder.like(email, pattern),
                        criteriaBuilder.like(subject, pattern),
                        criteriaBuilder.like(orderNumber, pattern)
                );
            });
        }
        if (dateFrom != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
        }
        if (dateTo != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), dateTo));
        }

        Sort sort = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        return supportMessageRepository.findAll(specification, sort)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupportMessageResponse getById(Long id) {
        return toResponse(findMessage(id));
    }

    @Transactional
    public SupportMessageResponse updateStatus(Long id, UpdateSupportMessageStatusRequest request) {
        SupportMessage message = findMessage(id);
        message.setStatus(request.status());
        return toResponse(message);
    }

    @Transactional
    public SupportMessageResponse updateNote(Long id, UpdateSupportMessageNoteRequest request) {
        SupportMessage message = findMessage(id);
        message.setAdminNote(normalizeOptional(request.adminNote()));
        return toResponse(message);
    }

    @Transactional
    public void delete(Long id) {
        supportMessageRepository.delete(findMessage(id));
    }

    private SupportMessage findMessage(Long id) {
        return supportMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support message not found."));
    }

    private String normalizeRequired(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private SupportMessageResponse toResponse(SupportMessage message) {
        return new SupportMessageResponse(
                message.getId(),
                message.getFullName(),
                message.getEmail(),
                message.getSubject(),
                message.getMessage(),
                message.getOrderNumber(),
                message.getStatus(),
                message.getAdminNote(),
                message.getCreatedAt(),
                message.getUpdatedAt()
        );
    }
}
