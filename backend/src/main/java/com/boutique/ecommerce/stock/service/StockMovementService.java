package com.boutique.ecommerce.stock.service;

import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.stock.dto.StockMovementResponse;
import com.boutique.ecommerce.stock.entity.StockMovement;
import com.boutique.ecommerce.stock.entity.StockMovementType;
import com.boutique.ecommerce.stock.repository.StockMovementRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockMovementService {

    private final StockMovementRepository movementRepository;
    private final UserRepository userRepository;

    public StockMovementService(StockMovementRepository movementRepository, UserRepository userRepository) {
        this.movementRepository = movementRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> getMovements(
            Long productId,
            StockMovementType movementType,
            Long orderId,
            LocalDateTime dateFrom,
            LocalDateTime dateTo
    ) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException("dateFrom must be before dateTo.");
        }
        Specification<StockMovement> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (productId != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("product").get("id"), productId));
        }
        if (movementType != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("movementType"), movementType));
        }
        if (orderId != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("order").get("id"), orderId));
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
        return movementRepository.findAll(specification, sort)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void recordOrderCreated(Product product, Order order, int stockBefore, int stockAfter) {
        save(product, order, null, StockMovementType.ORDER_CREATED, stockBefore, stockAfter,
                "Stock reserved for order " + order.getOrderNumber() + ".");
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void recordOrderCancelled(Product product, Order order, int stockBefore, int stockAfter) {
        save(product, order, getCurrentAdmin(), StockMovementType.ORDER_CANCELLED, stockBefore, stockAfter,
                "Stock restored after cancellation of order " + order.getOrderNumber() + ".");
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void recordManualAdjustment(Product product, int stockBefore, int stockAfter) {
        if (stockBefore == stockAfter) {
            return;
        }
        save(product, null, getCurrentAdmin(), StockMovementType.MANUAL_ADJUSTMENT, stockBefore, stockAfter,
                "Stock adjusted manually by an administrator.");
    }

    private void save(
            Product product,
            Order order,
            AppUser admin,
            StockMovementType type,
            int stockBefore,
            int stockAfter,
            String reason
    ) {
        int quantityChange = stockAfter - stockBefore;
        if (quantityChange == 0) {
            return;
        }
        movementRepository.save(StockMovement.builder()
                .product(product)
                .order(order)
                .admin(admin)
                .movementType(type)
                .quantityChange(quantityChange)
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .reason(reason)
                .build());
    }

    private AppUser getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .filter(user -> user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ADMIN))
                .orElse(null);
    }

    private StockMovementResponse toResponse(StockMovement movement) {
        Product product = movement.getProduct();
        Order order = movement.getOrder();
        AppUser admin = movement.getAdmin();
        return new StockMovementResponse(
                movement.getId(),
                product.getId(),
                product.getName(),
                order == null ? null : order.getId(),
                order == null ? null : order.getOrderNumber(),
                admin == null ? null : admin.getId(),
                admin == null ? null : admin.getFullName(),
                admin == null ? null : admin.getEmail(),
                movement.getMovementType(),
                movement.getQuantityChange(),
                movement.getStockBefore(),
                movement.getStockAfter(),
                movement.getReason(),
                movement.getCreatedAt()
        );
    }
}
