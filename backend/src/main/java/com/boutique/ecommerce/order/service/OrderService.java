package com.boutique.ecommerce.order.service;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.coupon.service.CouponService;
import com.boutique.ecommerce.coupon.service.CouponService.CouponCalculation;
import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.dto.DirectOrderRequest;
import com.boutique.ecommerce.order.dto.OrderItemResponse;
import com.boutique.ecommerce.order.dto.OrderResponse;
import com.boutique.ecommerce.order.dto.UpdateOrderStatusRequest;
import com.boutique.ecommerce.order.dto.UpdatePaymentStatusRequest;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.entity.OrderItem;
import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import com.boutique.ecommerce.order.repository.OrderRepository;
import com.boutique.ecommerce.notification.OrderCreatedEvent;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(
            OrderRepository orderRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            CouponService couponService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.couponService = couponService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        AppUser user = getCurrentUser();
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty.");
        }

        Order order = createPendingOrder(
                user,
                request.fullName(),
                request.phoneNumber(),
                request.streetAddress(),
                request.city(),
                request.postalCode(),
                request.deliveryNotes(),
                request.shippingAddress()
        );

        BigDecimal subtotalAmount = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            validateProductForOrder(product);
            validateStock(product, cartItem.getQuantity());

            OrderItem orderItem = OrderItem.fromProduct(product, cartItem.getQuantity());
            order.addItem(orderItem);
            subtotalAmount = subtotalAmount.add(orderItem.getSubtotal());

            int remainingStock = product.getStockQuantity() - cartItem.getQuantity();
            product.setStockQuantity(remainingStock);
            if (remainingStock == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
        }

        CouponCalculation couponCalculation = couponService.calculateDiscount(request.couponCode(), subtotalAmount, user);
        applyTotals(order, subtotalAmount, couponCalculation);
        Order savedOrder = orderRepository.save(order);
        couponService.registerUsage(couponCalculation.coupon(), user, savedOrder);
        cartItemRepository.deleteByUserId(user.getId());
        eventPublisher.publishEvent(new OrderCreatedEvent(savedOrder.getId()));

        return mapToOrderResponse(savedOrder);
    }

    @Transactional
    public OrderResponse createDirectOrder(DirectOrderRequest request) {
        AppUser user = getCurrentUser();
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        validateProductForOrder(product);
        validateStock(product, request.quantity());

        Order order = createPendingOrder(
                user,
                request.fullName(),
                request.phoneNumber(),
                request.streetAddress(),
                request.city(),
                request.postalCode(),
                request.deliveryNotes(),
                request.shippingAddress()
        );
        OrderItem orderItem = OrderItem.fromProduct(product, request.quantity());
        order.addItem(orderItem);
        CouponCalculation couponCalculation = couponService.calculateDiscount(request.couponCode(), orderItem.getSubtotal(), user);
        applyTotals(order, orderItem.getSubtotal(), couponCalculation);

        int remainingStock = product.getStockQuantity() - request.quantity();
        product.setStockQuantity(remainingStock);
        if (remainingStock == 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        }

        Order savedOrder = orderRepository.save(order);
        couponService.registerUsage(couponCalculation.coupon(), user, savedOrder);
        eventPublisher.publishEvent(new OrderCreatedEvent(savedOrder.getId()));
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
        if (request.status() == OrderStatus.CANCELLED) {
            restoreStock(order);
        }
        order.setStatus(request.status());
        return mapToOrderResponse(order);
    }

    @Transactional
    public OrderResponse updatePaymentStatus(Long id, UpdatePaymentStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot update payment status for a cancelled order.");
        }

        order.setPaymentStatus(request.paymentStatus());
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

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            if (product.getStatus() == ProductStatus.OUT_OF_STOCK && product.getStockQuantity() > 0) {
                product.setStatus(ProductStatus.ACTIVE);
            }
        }
    }

    private Order createPendingOrder(
            AppUser user,
            String fullName,
            String phoneNumber,
            String streetAddress,
            String city,
            String postalCode,
            String deliveryNotes,
            String shippingAddress
    ) {
        String normalizedStreet = normalizeRequired(streetAddress);
        String normalizedCity = normalizeRequired(city);
        String normalizedPostalCode = normalizeOptional(postalCode);
        String normalizedDeliveryNotes = normalizeOptional(deliveryNotes);

        return Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .customerName(normalizeOptional(fullName) == null ? user.getFullName() : normalizeOptional(fullName))
                .customerEmail(user.getEmail())
                .customerPhone(normalizeOptional(phoneNumber) == null ? user.getPhone() : normalizeOptional(phoneNumber))
                .subtotalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .shippingAddress(resolveShippingAddress(
                        shippingAddress,
                        normalizedStreet,
                        normalizedCity,
                        normalizedPostalCode,
                        normalizedDeliveryNotes
                ))
                .shippingStreetAddress(normalizedStreet)
                .shippingCity(normalizedCity)
                .shippingPostalCode(normalizedPostalCode)
                .deliveryNotes(normalizedDeliveryNotes)
                .build();
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

    private String normalizeRequired(String value) {
        return value.trim();
    }

    private String resolveShippingAddress(
            String shippingAddress,
            String streetAddress,
            String city,
            String postalCode,
            String deliveryNotes
    ) {
        String normalizedShippingAddress = normalizeOptional(shippingAddress);
        if (normalizedShippingAddress != null) {
            return normalizedShippingAddress;
        }

        StringBuilder builder = new StringBuilder();
        builder.append(streetAddress).append(", ").append(city);
        if (postalCode != null) {
            builder.append(" ").append(postalCode);
        }
        if (deliveryNotes != null) {
            builder.append(" | Notes: ").append(deliveryNotes);
        }
        return builder.toString();
    }

    private void applyTotals(Order order, BigDecimal subtotalAmount, CouponCalculation couponCalculation) {
        BigDecimal discountAmount = couponCalculation.discountAmount();
        order.setSubtotalAmount(subtotalAmount);
        order.setDiscountAmount(discountAmount);
        order.setCouponCode(couponCalculation.coupon() == null ? null : couponCalculation.coupon().getCode());
        order.setTotalAmount(subtotalAmount.subtract(discountAmount));
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
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getCustomerPhone(),
                order.getSubtotalAmount(),
                order.getDiscountAmount(),
                order.getCouponCode(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getShippingAddress(),
                order.getShippingStreetAddress(),
                order.getShippingCity(),
                order.getShippingPostalCode(),
                order.getDeliveryNotes(),
                order.getCreatedAt(),
                items
        );
    }
}
