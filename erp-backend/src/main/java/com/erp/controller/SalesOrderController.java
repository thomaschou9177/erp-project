package com.erp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.dto.ApiResponse;
import com.erp.dto.CreateOrderRequest;
import com.erp.entity.SalesOrder;
import com.erp.repository.SalesOrderRepository;
import com.erp.service.SalesOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;
    private final SalesOrderRepository salesOrderRepository;

    // 建立新訂單 (包含扣庫存與算價)
    @PostMapping
    public ResponseEntity<ApiResponse<SalesOrder>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        SalesOrder order = salesOrderService.createOrder(request);
        return ResponseEntity.ok(ApiResponse.success("訂單建立成功", order));
    }

    // 查詢所有訂單
    @GetMapping
    public ResponseEntity<ApiResponse<List<SalesOrder>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.success(salesOrderRepository.findAll()));
    }

    // 依單號查詢訂單詳情
    @GetMapping("/{orderCode}")
    public ResponseEntity<ApiResponse<SalesOrder>> getOrderByCode(@PathVariable String orderCode) {
        SalesOrder order = salesOrderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("找不到訂單單號: " + orderCode));
        return ResponseEntity.ok(ApiResponse.success(order));
    }
}