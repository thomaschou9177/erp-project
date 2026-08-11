package com.erp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.dto.AdjustStockRequest;
import com.erp.dto.ApiResponse;
import com.erp.entity.Inventory;
import com.erp.entity.InventoryLog;
import com.erp.repository.InventoryLogRepository;
import com.erp.repository.InventoryRepository;
import com.erp.service.InventoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inventories")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final InventoryService inventoryService;

    // 查詢特定商品的庫存
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Inventory>> getStockByProductId(@PathVariable Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new IllegalArgumentException("找不到商品 ID: " + productId + " 的庫存紀錄"));
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    // 進貨/增加庫存
    @PostMapping("/inbound")
    public ResponseEntity<ApiResponse<String>> addStock(@Valid @RequestBody AdjustStockRequest request) {
        inventoryService.addStock(
                request.getProductId(),
                request.getQuantity(),
                request.getReferenceNo(),
                request.getOperator());
        return ResponseEntity.ok(ApiResponse.success("進貨處理成功", null));
    }

    // 查詢特定商品的庫存異動日誌 (Audit Trail)
    @GetMapping("/logs/{productId}")
    public ResponseEntity<ApiResponse<List<InventoryLog>>> getInventoryLogs(@PathVariable Long productId) {
        List<InventoryLog> logs = inventoryLogRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}