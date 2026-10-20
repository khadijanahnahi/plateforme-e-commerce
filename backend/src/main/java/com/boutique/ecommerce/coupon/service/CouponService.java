package com.boutique.ecommerce.coupon.service;

import com.boutique.ecommerce.cart.entity.CartItem;
import com.boutique.ecommerce.cart.repository.CartItemRepository;
import com.boutique.ecommerce.common.exception.ResourceConflictException;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.coupon.dto.CouponRequest;
import com.boutique.ecommerce.coupon.dto.CouponResponse;
import com.boutique.ecommerce.coupon.dto.CouponValidationResponse;
import com.boutique.ecommerce.coupon.dto.PublicCouponResponse;
import com.boutique.ecommerce.coupon.dto.ValidateDirectCouponRequest;
import com.boutique.ecommerce.coupon.dto.ValidateCouponRequest;
import com.boutique.ecommerce.coupon.entity.Coupon;
import com.boutique.ecommerce.coupon.entity.CouponUsage;
import com.boutique.ecommerce.coupon.entity.DiscountType;
import com.boutique.ecommerce.coupon.repository.CouponRepository;
import com.boutique.ecommerce.coupon.repository.CouponUsageRepository;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.product.entity.Product;
import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.repository.ProductRepository;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CouponService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CouponService(
            CouponRepository couponRepository,
            CouponUsageRepository couponUsageRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> getAll() {
        return couponRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CouponResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public List<PublicCouponResponse> getActivePublicCoupons() {
        return couponRepository.findActivePublicCoupons(LocalDateTime.now())
                .stream()
                .map(this::toPublicResponse)
                .toList();
    }

    @Transactional
    public CouponResponse create(CouponRequest request) {
        String code = normalizeCode(request.code());
        validateUniqueCode(code, null);
        validateLimits(request.usageLimit(), request.perUserLimit());

        Coupon coupon = Coupon.builder()
                .code(code)
                .name(normalizeRequired(request.name()))
                .description(normalizeOptional(request.description()))
                .discountType(request.discountType())
                .discountValue(scaleMoney(request.discountValue()))
                .minimumOrderAmount(scaleMoneyOrNull(request.minimumOrderAmount()))
                .maxDiscountAmount(scaleMoneyOrNull(request.maxDiscountAmount()))
                .usageLimit(request.usageLimit())
                .perUserLimit(request.perUserLimit())
                .active(request.active() == null || request.active())
                .publiclyVisible(Boolean.TRUE.equals(request.publiclyVisible()))
                .startsAt(request.startsAt())
                .expiresAt(request.expiresAt())
                .build();

        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public CouponResponse update(Long id, CouponRequest request) {
        Coupon coupon = findById(id);
        String code = normalizeCode(request.code());
        validateUniqueCode(code, id);
        validateLimits(request.usageLimit(), request.perUserLimit());

        coupon.setCode(code);
        coupon.setName(normalizeRequired(request.name()));
        coupon.setDescription(normalizeOptional(request.description()));
        coupon.setDiscountType(request.discountType());
        coupon.setDiscountValue(scaleMoney(request.discountValue()));
        coupon.setMinimumOrderAmount(scaleMoneyOrNull(request.minimumOrderAmount()));
        coupon.setMaxDiscountAmount(scaleMoneyOrNull(request.maxDiscountAmount()));
        coupon.setUsageLimit(request.usageLimit());
        coupon.setPerUserLimit(request.perUserLimit());
        coupon.setActive(request.active() == null || request.active());
        coupon.setPubliclyVisible(Boolean.TRUE.equals(request.publiclyVisible()));
        coupon.setStartsAt(request.startsAt());
        coupon.setExpiresAt(request.expiresAt());

        return toResponse(coupon);
    }

    @Transactional
    public CouponResponse activate(Long id) {
        Coupon coupon = findById(id);
        coupon.setActive(true);
        return toResponse(coupon);
    }

    @Transactional
    public CouponResponse deactivate(Long id) {
        Coupon coupon = findById(id);
        coupon.setActive(false);
        return toResponse(coupon);
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validateForCurrentCart(ValidateCouponRequest request) {
        AppUser user = getCurrentUser();
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty.");
        }

        BigDecimal subtotal = cartItems.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        CouponCalculation calculation = calculateDiscount(request.code(), subtotal, user);

        return new CouponValidationResponse(
                calculation.coupon().getCode(),
                true,
                scaleMoney(subtotal),
                calculation.discountAmount(),
                scaleMoney(subtotal.subtract(calculation.discountAmount())),
                "Coupon applied."
        );
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validateForDirectCheckout(ValidateDirectCouponRequest request) {
        AppUser user = getCurrentUser();
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Product is not available.");
        }
        if (request.quantity() > product.getStockQuantity()) {
            throw new IllegalArgumentException("Insufficient stock for product.");
        }

        BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(request.quantity()));
        CouponCalculation calculation = calculateDiscount(request.code(), subtotal, user);

        return new CouponValidationResponse(
                calculation.coupon().getCode(),
                true,
                scaleMoney(subtotal),
                calculation.discountAmount(),
                scaleMoney(subtotal.subtract(calculation.discountAmount())),
                "Coupon applied."
        );
    }

    @Transactional(readOnly = true)
    public CouponCalculation calculateDiscount(String code, BigDecimal subtotal, AppUser user) {
        if (code == null || code.isBlank()) {
            return new CouponCalculation(null, BigDecimal.ZERO);
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(normalizeCode(code))
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found."));
        validateCoupon(coupon, subtotal, user);
        return new CouponCalculation(coupon, calculateDiscountAmount(coupon, subtotal));
    }

    @Transactional
    public void registerUsage(Coupon coupon, AppUser user, Order order) {
        if (coupon == null) {
            return;
        }

        coupon.incrementUsedCount();
        couponUsageRepository.save(CouponUsage.builder()
                .coupon(coupon)
                .user(user)
                .order(order)
                .usedAt(LocalDateTime.now())
                .build());
    }

    private void validateCoupon(Coupon coupon, BigDecimal subtotal, AppUser user) {
        LocalDateTime now = LocalDateTime.now();
        if (!coupon.isActive()) {
            throw new IllegalArgumentException("Coupon is not active.");
        }
        if (coupon.getStartsAt() != null && coupon.getStartsAt().isAfter(now)) {
            throw new IllegalArgumentException("Coupon is not started yet.");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException("Coupon has expired.");
        }
        if (coupon.getMinimumOrderAmount() != null && subtotal.compareTo(coupon.getMinimumOrderAmount()) < 0) {
            throw new IllegalArgumentException("Minimum order amount not reached for this coupon.");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new IllegalArgumentException("Coupon usage limit reached.");
        }
        if (coupon.getPerUserLimit() != null) {
            long usageCount = couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), user.getId());
            if (usageCount >= coupon.getPerUserLimit()) {
                throw new IllegalArgumentException("You have already used this coupon.");
            }
        }
    }

    private BigDecimal calculateDiscountAmount(Coupon coupon, BigDecimal subtotal) {
        BigDecimal discount = coupon.getDiscountType() == DiscountType.PERCENTAGE
                ? subtotal.multiply(coupon.getDiscountValue()).divide(HUNDRED, 2, RoundingMode.HALF_UP)
                : coupon.getDiscountValue();

        if (coupon.getDiscountType() == DiscountType.PERCENTAGE && coupon.getMaxDiscountAmount() != null) {
            discount = discount.min(coupon.getMaxDiscountAmount());
        }

        return scaleMoney(discount.min(subtotal));
    }

    private Coupon findById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found."));
    }

    private AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private void validateUniqueCode(String code, Long currentCouponId) {
        couponRepository.findByCodeIgnoreCase(code)
                .filter(coupon -> currentCouponId == null || !coupon.getId().equals(currentCouponId))
                .ifPresent(coupon -> {
                    throw new ResourceConflictException("Coupon code already exists.");
                });
    }

    private void validateLimits(Integer usageLimit, Integer perUserLimit) {
        if (usageLimit != null && usageLimit <= 0) {
            throw new IllegalArgumentException("Usage limit must be greater than 0.");
        }
        if (perUserLimit != null && perUserLimit <= 0) {
            throw new IllegalArgumentException("Per-user limit must be greater than 0.");
        }
    }

    private String normalizeCode(String code) {
        return normalizeRequired(code).toUpperCase();
    }

    private String normalizeRequired(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Required value is missing.");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleMoneyOrNull(BigDecimal value) {
        return value == null ? null : scaleMoney(value);
    }

    private CouponResponse toResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getName(),
                coupon.getDescription(),
                coupon.getDiscountType(),
                coupon.getDiscountValue(),
                coupon.getMinimumOrderAmount(),
                coupon.getMaxDiscountAmount(),
                coupon.getUsageLimit(),
                coupon.getUsedCount(),
                coupon.getPerUserLimit(),
                coupon.isActive(),
                coupon.isPubliclyVisible(),
                coupon.getStartsAt(),
                coupon.getExpiresAt(),
                coupon.getCreatedAt(),
                coupon.getUpdatedAt()
        );
    }

    private PublicCouponResponse toPublicResponse(Coupon coupon) {
        return new PublicCouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getName(),
                coupon.getDescription(),
                coupon.getDiscountType(),
                coupon.getDiscountValue(),
                coupon.getMinimumOrderAmount(),
                coupon.getMaxDiscountAmount(),
                coupon.getStartsAt(),
                coupon.getExpiresAt()
        );
    }

    public record CouponCalculation(Coupon coupon, BigDecimal discountAmount) {
    }
}
