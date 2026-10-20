package com.boutique.ecommerce.banner.service;

import com.boutique.ecommerce.banner.dto.BannerRequest;
import com.boutique.ecommerce.banner.dto.BannerResponse;
import com.boutique.ecommerce.banner.entity.Banner;
import com.boutique.ecommerce.banner.entity.BannerPlacement;
import com.boutique.ecommerce.banner.repository.BannerRepository;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BannerService {

    private final BannerRepository bannerRepository;

    public BannerService(BannerRepository bannerRepository) {
        this.bannerRepository = bannerRepository;
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> getPublicBanners(BannerPlacement placement) {
        return bannerRepository.findPublicBanners(placement, LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> getAll() {
        return bannerRepository.findAllByOrderByPriorityAscCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BannerResponse getById(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public BannerResponse create(BannerRequest request) {
        validateDateRange(request.startsAt(), request.endsAt());

        Banner banner = Banner.builder()
                .title(normalizeRequired(request.title()))
                .subtitle(normalizeOptional(request.subtitle()))
                .imageUrl(normalizeOptional(request.imageUrl()))
                .buttonText(normalizeOptional(request.buttonText()))
                .targetUrl(normalizeOptional(request.targetUrl()))
                .placement(request.placement())
                .active(request.active() == null || request.active())
                .priority(resolvePriority(request.priority()))
                .startsAt(request.startsAt())
                .endsAt(request.endsAt())
                .build();

        return toResponse(bannerRepository.save(banner));
    }

    @Transactional
    public BannerResponse update(Long id, BannerRequest request) {
        validateDateRange(request.startsAt(), request.endsAt());
        Banner banner = findById(id);

        banner.setTitle(normalizeRequired(request.title()));
        banner.setSubtitle(normalizeOptional(request.subtitle()));
        banner.setImageUrl(normalizeOptional(request.imageUrl()));
        banner.setButtonText(normalizeOptional(request.buttonText()));
        banner.setTargetUrl(normalizeOptional(request.targetUrl()));
        banner.setPlacement(request.placement());
        banner.setActive(request.active() == null || request.active());
        banner.setPriority(resolvePriority(request.priority()));
        banner.setStartsAt(request.startsAt());
        banner.setEndsAt(request.endsAt());

        return toResponse(banner);
    }

    @Transactional
    public BannerResponse activate(Long id) {
        Banner banner = findById(id);
        banner.setActive(true);
        return toResponse(banner);
    }

    @Transactional
    public BannerResponse deactivate(Long id) {
        Banner banner = findById(id);
        banner.setActive(false);
        return toResponse(banner);
    }

    @Transactional
    public void delete(Long id) {
        Banner banner = findById(id);
        bannerRepository.delete(banner);
    }

    private Banner findById(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found."));
    }

    private void validateDateRange(LocalDateTime startsAt, LocalDateTime endsAt) {
        if (startsAt != null && endsAt != null && endsAt.isBefore(startsAt)) {
            throw new IllegalArgumentException("Banner end date must be after start date.");
        }
    }

    private Integer resolvePriority(Integer priority) {
        return priority == null ? 100 : priority;
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

    private BannerResponse toResponse(Banner banner) {
        return new BannerResponse(
                banner.getId(),
                banner.getTitle(),
                banner.getSubtitle(),
                banner.getImageUrl(),
                banner.getButtonText(),
                banner.getTargetUrl(),
                banner.getPlacement(),
                banner.isActive(),
                banner.getPriority(),
                banner.getStartsAt(),
                banner.getEndsAt(),
                banner.getCreatedAt(),
                banner.getUpdatedAt()
        );
    }
}
