package com.boutique.ecommerce.returnrequest.service;

import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderItemRepository;
import com.boutique.ecommerce.returnrequest.dto.CreateReturnRequest;
import com.boutique.ecommerce.returnrequest.dto.EligibleReturnItemResponse;
import com.boutique.ecommerce.returnrequest.dto.ReturnRequestResponse;
import com.boutique.ecommerce.returnrequest.dto.UpdateReturnRequestStatus;
import com.boutique.ecommerce.returnrequest.entity.ReturnRequest;
import com.boutique.ecommerce.returnrequest.entity.ReturnRequestStatus;
import com.boutique.ecommerce.returnrequest.repository.ReturnRequestRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReturnRequestService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    public ReturnRequestService(
            ReturnRequestRepository returnRequestRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository
    ) {
        this.returnRequestRepository = returnRequestRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<EligibleReturnItemResponse> getEligibleItems() {
        AppUser user = getCurrentUser();
        Set<Long> requestedItemIds = returnRequestRepository.findRequestedOrderItemIds(user.getId());
        return orderItemRepository.findEligibleReturnItems(
                        user.getId(),
                        OrderStatus.DELIVERED,
                        PaymentStatus.PAID
                ).stream()
                .filter(item -> !requestedItemIds.contains(item.getId()))
                .map(this::toEligibleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getMyRequests() {
        AppUser user = getCurrentUser();
        return returnRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReturnRequestResponse create(CreateReturnRequest request) {
        AppUser user = getCurrentUser();
        OrderItem item = orderItemRepository.findById(request.orderItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found."));

        if (!item.getOrder().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Order item not found.");
        }
        if (item.getOrder().getStatus() != OrderStatus.DELIVERED
                || item.getOrder().getPaymentStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("A return can only be requested for a delivered and paid order.");
        }
        if (request.quantity() > item.getQuantity()) {
            throw new IllegalArgumentException("Return quantity cannot exceed purchased quantity.");
        }
        if (returnRequestRepository.existsByUserIdAndOrderItemId(user.getId(), item.getId())) {
            throw new ResourceConflictException("A return request already exists for this order item.");
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .user(user)
                .order(item.getOrder())
                .orderItem(item)
                .productName(item.getProductName())
                .productImageUrl(item.getProduct().getImageUrl())
                .unitPrice(item.getUnitPrice())
                .quantity(request.quantity())
                .reason(request.reason())
                .details(request.details().trim())
                .status(ReturnRequestStatus.REQUESTED)
                .build();

        return toResponse(returnRequestRepository.save(returnRequest));
    }

    @Transactional
    public ReturnRequestResponse cancelOwnRequest(Long id) {
        AppUser user = getCurrentUser();
        ReturnRequest request = returnRequestRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found."));

        if (request.getStatus() != ReturnRequestStatus.REQUESTED) {
            throw new IllegalArgumentException("Only a pending return request can be cancelled.");
        }
        request.setStatus(ReturnRequestStatus.CANCELLED);
        return toResponse(request);
    }

    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getAllForAdmin() {
        return returnRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReturnRequestResponse updateStatusForAdmin(Long id, UpdateReturnRequestStatus update) {
        ReturnRequest request = returnRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Return request not found."));

        validateTransition(request.getStatus(), update.status());
        request.setStatus(update.status());
        request.setAdminNote(normalizeNullable(update.adminNote()));
        return toResponse(request);
    }

    private void validateTransition(ReturnRequestStatus current, ReturnRequestStatus next) {
        if (current == next) {
            return;
        }

        EnumSet<ReturnRequestStatus> allowed = switch (current) {
            case REQUESTED -> EnumSet.of(
                    ReturnRequestStatus.UNDER_REVIEW,
                    ReturnRequestStatus.APPROVED,
                    ReturnRequestStatus.REJECTED,
                    ReturnRequestStatus.CANCELLED
            );
            case UNDER_REVIEW -> EnumSet.of(ReturnRequestStatus.APPROVED, ReturnRequestStatus.REJECTED);
            case APPROVED -> EnumSet.of(ReturnRequestStatus.RECEIVED, ReturnRequestStatus.CANCELLED);
            case RECEIVED -> EnumSet.of(ReturnRequestStatus.COMPLETED);
            case REJECTED, COMPLETED, CANCELLED -> EnumSet.noneOf(ReturnRequestStatus.class);
        };

        if (!allowed.contains(next)) {
            throw new IllegalArgumentException("Invalid return request status transition.");
        }
    }

    private EligibleReturnItemResponse toEligibleResponse(OrderItem item) {
        return new EligibleReturnItemResponse(
                item.getOrder().getId(),
                item.getOrder().getOrderNumber(),
                item.getOrder().getCreatedAt(),
                item.getId(),
                item.getProduct().getId(),
                item.getProductName(),
                item.getProduct().getImageUrl(),
                item.getQuantity(),
                item.getUnitPrice()
        );
    }

    private ReturnRequestResponse toResponse(ReturnRequest request) {
        return new ReturnRequestResponse(
                request.getId(),
                request.getUser().getFullName(),
                request.getUser().getEmail(),
                request.getOrder().getId(),
                request.getOrder().getOrderNumber(),
                request.getOrderItem().getId(),
                request.getOrderItem().getProduct().getId(),
                request.getProductName(),
                request.getProductImageUrl(),
                request.getUnitPrice(),
                request.getQuantity(),
                request.getReason(),
                request.getDetails(),
                request.getStatus(),
                request.getAdminNote(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
