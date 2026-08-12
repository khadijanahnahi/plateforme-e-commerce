package com.boutique.ecommerce.order.controller;

import com.boutique.ecommerce.order.dto.CreateOrderRequest;
import com.boutique.ecommerce.order.dto.DirectOrderRequest;
import com.boutique.ecommerce.order.dto.OrderResponse;
import com.boutique.ecommerce.order.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.boutique.ecommerce.order.service.ClientOrderStreamService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final ClientOrderStreamService clientOrderStreamService;

    public OrderController(OrderService orderService, ClientOrderStreamService clientOrderStreamService) {
        this.orderService = orderService;
        this.clientOrderStreamService = clientOrderStreamService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    @PostMapping("/direct")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createDirectOrder(@Valid @RequestBody DirectOrderRequest request) {
        return orderService.createDirectOrder(request);
    }

    @GetMapping("/my-orders")
    public List<OrderResponse> getMyOrders() {
        return orderService.getMyOrders();
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMyOrderUpdates(Authentication authentication) {
        return clientOrderStreamService.subscribe(authentication.getName());
    }

    @GetMapping("/{id}")
    public OrderResponse getMyOrderById(@PathVariable Long id) {
        return orderService.getMyOrderById(id);
    }
}
