package com.boutique.ecommerce.order.service;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.dto.OrderItemResponse;
import com.boutique.ecommerce.order.dto.OrderResponse;
import com.boutique.ecommerce.order.dto.UpdateOrderStatusRequest;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        AppUser user = getCurrentUser();
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty.");
        }

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .totalAmount(BigDecimal.ZERO)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .shippingAddress(normalizeOptional(request.shippingAddress()))
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            validateProductForOrder(product);
            validateStock(product, cartItem.getQuantity());

            OrderItem orderItem = OrderItem.fromProduct(product, cartItem.getQuantity());
            order.addItem(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());

            int remainingStock = product.getStockQuantity() - cartItem.getQuantity();
            product.setStockQuantity(remainingStock);
            if (remainingStock == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteByUserId(user.getId());

        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders() {
        AppUser user = getCurrentUser();
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getMyOrderById(Long id) {
        AppUser user = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdForAdmin(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        return mapToOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));

        validateStatusTransition(order.getStatus(), request.status());
        order.setStatus(request.status());
        return mapToOrderResponse(order);
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private void validateProductForOrder(Product product) {
        if (product == null) {
            throw new ResourceNotFoundException("Product not found.");
        }
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Product is not available for order.");
        }
    }

    private void validateStock(Product product, Integer requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0.");
        }
        if (requestedQuantity > product.getStockQuantity()) {
            throw new IllegalArgumentException("Insufficient stock for product.");
        }
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean allowed = switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.SHIPPED || next == OrderStatus.CANCELLED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };

        if (!allowed) {
            throw new IllegalArgumentException("Invalid order status transition.");
        }
    }

    private String generateOrderNumber() {
        String orderNumber;
        do {
            orderNumber = "ORD-" + UUID.randomUUID().toString()
                    .replace("-", "")
                    .substring(0, 12)
                    .toUpperCase();
        } while (orderRepository.existsByOrderNumber(orderNumber));
        return orderNumber;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems()
                .stream()
                .map(item -> new OrderItemResponse(
                        item.getProduct().getId(),
                        item.getProductName(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getSubtotal()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getShippingAddress(),
                order.getCreatedAt(),
                items
        );
    }
}
