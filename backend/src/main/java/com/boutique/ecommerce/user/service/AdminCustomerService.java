package com.boutique.ecommerce.user.service;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.user.dto.AdminCustomerResponse;
import com.boutique.ecommerce.user.entity.RoleName;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCustomerService {

    private final UserRepository userRepository;

    public AdminCustomerService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminCustomerResponse> getCustomers() {
        return userRepository.findAdminCustomers(RoleName.USER, OrderStatus.CANCELLED);
    }
}
