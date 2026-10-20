package com.boutique.ecommerce.order.service;

import com.boutique.ecommerce.order.dto.ClientOrderUpdateResponse;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.repository.OrderRepository;
import java.io.IOException;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class ClientOrderStreamService {

    private static final Logger log = LoggerFactory.getLogger(ClientOrderStreamService.class);
    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> emittersByUser =
            new ConcurrentHashMap<>();
    private final OrderRepository orderRepository;

    public ClientOrderStreamService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public SseEmitter subscribe(String authenticatedEmail) {
        String userKey = normalize(authenticatedEmail);
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emittersByUser.computeIfAbsent(userKey, ignored -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> remove(userKey, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(error -> cleanup.run());
        send(userKey, emitter, "connected", "ok");
        return emitter;
    }

    @Transactional(readOnly = true)
    public void broadcastOrderUpdate(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getUser() == null || order.getUser().getEmail() == null) {
            return;
        }

        String userKey = normalize(order.getUser().getEmail());
        ClientOrderUpdateResponse response = new ClientOrderUpdateResponse(
                order.getId(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getUpdatedAt()
        );
        emittersByUser.getOrDefault(userKey, new CopyOnWriteArrayList<>())
                .forEach(emitter -> send(userKey, emitter, "order-updated", response));
    }

    @Scheduled(fixedDelay = 25_000)
    public void heartbeat() {
        emittersByUser.forEach((userKey, emitters) ->
                emitters.forEach(emitter -> send(userKey, emitter, "heartbeat", "ping")));
    }

    private void send(String userKey, SseEmitter emitter, String eventName, Object data) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (IOException | IllegalStateException exception) {
            remove(userKey, emitter);
            emitter.complete();
            log.debug("client order SSE connection closed");
        }
    }

    private void remove(String userKey, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUser.get(userKey);
        if (emitters == null) return;
        emitters.remove(emitter);
        if (emitters.isEmpty()) emittersByUser.remove(userKey, emitters);
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
