package com.boutique.ecommerce.order.service;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.coupon.service.CouponService;
import com.boutique.ecommerce.coupon.service.CouponService.CouponCalculation;
import com.boutique.ecommerce.invoice.event.InvoiceRequestedEvent;
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
import com.boutique.ecommerce.notification.OrderPaymentStatusChangedEvent;
import com.boutique.ecommerce.notification.OrderStatusChangedEvent;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.entity.ProductSize;
import com.boutique.ecommerce.product.entity.ProductVariant;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.product.repository.ProductVariantRepository;
import com.boutique.ecommerce.promotion.service.PromotionService;
import com.boutique.ecommerce.promotion.service.PromotionService.EffectivePriceResult;
import com.boutique.ecommerce.stock.service.StockMovementService;
import com.boutique.ecommerce.settings.service.StoreSettingsService;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
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
    private final PromotionService promotionService;
    private final ApplicationEventPublisher eventPublisher;
    private final StockMovementService stockMovementService;
    private final StoreSettingsService storeSettingsService;
    private final ProductVariantRepository productVariantRepository;

    public OrderService(
            OrderRepository orderRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            CouponService couponService,
            PromotionService promotionService,
            ApplicationEventPublisher eventPublisher,
            StockMovementService stockMovementService,
            StoreSettingsService storeSettingsService,
            ProductVariantRepository productVariantRepository
    ) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.couponService = couponService;
        this.promotionService = promotionService;
        this.eventPublisher = eventPublisher;
        this.stockMovementService = stockMovementService;
        this.storeSettingsService = storeSettingsService;
        this.productVariantRepository = productVariantRepository;
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
        List<StockChange> stockChanges = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            ProductVariant variant = cartItem.getVariant() == null
                    ? resolveVariant(product, null)
                    : cartItem.getVariant();
            validateProductForOrder(product);
            validateStock(variant, cartItem.getQuantity());

            EffectivePriceResult price = promotionService.getEffectivePrice(product);
            OrderItem orderItem = createOrderItem(product, variant, cartItem.getQuantity(), price);
            order.addItem(orderItem);
            subtotalAmount = subtotalAmount.add(orderItem.getSubtotal());

            int stockBefore = product.getStockQuantity();
            int remainingStock = stockBefore - cartItem.getQuantity();
            product.setStockQuantity(remainingStock);
            variant.setStockQuantity(variant.getStockQuantity() - cartItem.getQuantity());
            stockChanges.add(new StockChange(product, stockBefore, remainingStock));
            if (remainingStock == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
        }

        CouponCalculation couponCalculation = couponService.calculateDiscount(request.couponCode(), subtotalAmount, user);
        applyTotals(order, subtotalAmount, couponCalculation);
        Order savedOrder = orderRepository.save(order);
        stockChanges.forEach(change -> stockMovementService.recordOrderCreated(
                change.product(), savedOrder, change.stockBefore(), change.stockAfter()));
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
        ProductVariant variant = resolveVariant(product, request.variantId());
        validateStock(variant, request.quantity());

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
        EffectivePriceResult price = promotionService.getEffectivePrice(product);
        OrderItem orderItem = createOrderItem(product, variant, request.quantity(), price);
        order.addItem(orderItem);
        CouponCalculation couponCalculation = couponService.calculateDiscount(request.couponCode(), orderItem.getSubtotal(), user);
        applyTotals(order, orderItem.getSubtotal(), couponCalculation);

        int stockBefore = product.getStockQuantity();
        int remainingStock = stockBefore - request.quantity();
        product.setStockQuantity(remainingStock);
        variant.setStockQuantity(variant.getStockQuantity() - request.quantity());
        if (remainingStock == 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        }

        Order savedOrder = orderRepository.save(order);
        stockMovementService.recordOrderCreated(product, savedOrder, stockBefore, remainingStock);
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

        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = request.status();
        if (oldStatus == newStatus) {
            throw new IllegalArgumentException("Order already has this status.");
        }

        validateStatusTransition(oldStatus, newStatus);
        if (request.status() == OrderStatus.CANCELLED) {
            restoreStock(order);
        }
        order.setStatus(newStatus);
        eventPublisher.publishEvent(new OrderStatusChangedEvent(order.getId(), oldStatus, newStatus));
        return mapToOrderResponse(order);
    }

    @Transactional
    public OrderResponse updatePaymentStatus(Long id, UpdatePaymentStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot update payment status for a cancelled order.");
        }

        PaymentStatus oldPaymentStatus = order.getPaymentStatus();
        PaymentStatus newPaymentStatus = request.paymentStatus();
        if (oldPaymentStatus == newPaymentStatus) {
            throw new IllegalArgumentException("Order already has this payment status.");
        }

        order.setPaymentStatus(newPaymentStatus);
        eventPublisher.publishEvent(new OrderPaymentStatusChangedEvent(
                order.getId(), oldPaymentStatus, newPaymentStatus));
        if (oldPaymentStatus == PaymentStatus.UNPAID && newPaymentStatus == PaymentStatus.PAID) {
            eventPublisher.publishEvent(new InvoiceRequestedEvent(order.getId()));
        }
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

    private ProductVariant resolveVariant(Product product, Long variantId) {
        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findByIdAndProductId(variantId, product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found."));
            if (!Boolean.TRUE.equals(variant.getActive())) {
                throw new IllegalArgumentException("Product variant is not available.");
            }
            return variant;
        }

        List<ProductVariant> variants = productVariantRepository.findByProductIdAndActiveTrueOrderById(product.getId());
        if (variants.isEmpty()) {
            return productVariantRepository.save(ProductVariant.builder()
                    .product(product)
                    .size(ProductSize.TAILLE_UNIQUE)
                    .stockQuantity(product.getStockQuantity())
                    .active(true)
                    .build());
        }
        if (variants.size() != 1) {
            throw new IllegalArgumentException("Please select a product size.");
        }
        return variants.get(0);
    }

    private void validateStock(ProductVariant variant, Integer requestedQuantity) {
        if (variant == null || !Boolean.TRUE.equals(variant.getActive())) {
            throw new IllegalArgumentException("Product variant is not available.");
        }
        if (requestedQuantity == null || requestedQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0.");
        }
        if (requestedQuantity > variant.getStockQuantity()) {
            throw new IllegalArgumentException("Insufficient stock for selected size.");
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
            ProductVariant variant = item.getProductVariant();
            int stockBefore = product.getStockQuantity();
            int stockAfter = stockBefore + item.getQuantity();
            product.setStockQuantity(stockAfter);
            if (variant != null) {
                variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
            }
            if (product.getStatus() == ProductStatus.OUT_OF_STOCK && product.getStockQuantity() > 0) {
                product.setStatus(ProductStatus.ACTIVE);
            }
            stockMovementService.recordOrderCancelled(product, order, stockBefore, stockAfter);
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
                .deliveryFee(BigDecimal.ZERO)
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
        BigDecimal chargeableAmount = subtotalAmount.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal deliveryFee = storeSettingsService.calculateDeliveryFee(chargeableAmount);
        order.setSubtotalAmount(subtotalAmount);
        order.setDiscountAmount(discountAmount);
        order.setCouponCode(couponCalculation.coupon() == null ? null : couponCalculation.coupon().getCode());
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(chargeableAmount.add(deliveryFee));
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems()
                .stream()
                .map(item -> new OrderItemResponse(
                        item.getProduct().getId(),
                        item.getProductVariant() == null ? null : item.getProductVariant().getId(),
                        item.getVariantSize(),
                        item.getVariantSku(),
                        item.getProductName(),
                        item.getUnitPrice(),
                        item.getOriginalPrice(),
                        item.getDiscountAmount(),
                        item.getPromotionTitle(),
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
                order.getDeliveryFee(),
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

    private OrderItem createOrderItem(Product product, ProductVariant variant, int quantity, EffectivePriceResult price) {
        return OrderItem.fromProduct(
                product,
                variant,
                quantity,
                price.effectivePrice(),
                price.promotionActive() ? price.originalPrice() : null,
                price.promotionActive() ? price.discountAmount() : BigDecimal.ZERO,
                price.promotionActive() ? price.promotionTitle() : null
        );
    }

    private record StockChange(Product product, int stockBefore, int stockAfter) {
    }
}
