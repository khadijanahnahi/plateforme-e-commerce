package com.boutique.ecommerce.adminnotification.service;

import com.boutique.ecommerce.adminnotification.dto.AdminNotificationResponse;
import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class AdminNotificationStreamService {

    private static final Logger log = LoggerFactory.getLogger(AdminNotificationStreamService.class);
    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(error -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException exception) {
            emitters.remove(emitter);
            emitter.completeWithError(exception);
        }
        return emitter;
    }

    public void broadcast(AdminNotificationResponse notification) {
        emitters.forEach(emitter -> send(emitter, "notification", notification));
    }

    @Scheduled(fixedDelay = 25_000)
    public void heartbeat() {
        emitters.forEach(emitter -> send(emitter, "heartbeat", "ping"));
    }

    private void send(SseEmitter emitter, String eventName, Object data) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (IOException | IllegalStateException exception) {
            emitters.remove(emitter);
            emitter.complete();
            log.debug("admin notification SSE connection closed");
        }
    }
}
