package com.erp.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
import com.erp.repository.InventoryRepository;
import com.erp.service.InventoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inventories")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;

    /**
     * 1. 查詢所有商品庫存 (供前端庫存主頁面 Table 展示)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Inventory>>> getAllInventories() {
        List<Inventory> inventories = inventoryRepository.findAll(Sort.by(Sort.Direction.ASC, "productId"));
        return ResponseEntity.ok(ApiResponse.success(inventories));
    }

    /**
     * 2. 查詢特定商品的庫存
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Inventory>> getStockByProductId(@PathVariable Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new IllegalArgumentException("找不到商品 ID: " + productId + " 的庫存紀錄"));
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    /**
     * 3. 統一庫存調整 API (支援 INBOUND / OUTBOUND / ADJUST)
     */
    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<Inventory>> adjustStock(@Valid @RequestBody AdjustStockRequest request) {
        Inventory updatedInventory = inventoryService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success("庫存調整成功", updatedInventory));
    }

    /**
     * 4. 進貨專用 API (保留傳統單一行為 Endpoint)
     */
    @PostMapping("/inbound")
    public ResponseEntity<ApiResponse<Inventory>> addStock(@Valid @RequestBody AdjustStockRequest request) {
        Inventory updatedInventory = inventoryService.addStock(
                request.getProductId(),
                request.getQuantity(),
                request.getReferenceNo(),
                request.getOperator());
        return ResponseEntity.ok(ApiResponse.success("進貨處理成功", updatedInventory));
    }

    /**
     * 5. 分頁查詢所有庫存異動日誌 ( Audit Trail 全覽 )
     */
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<InventoryLog>>> getAllLogs(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllLogs(pageable)));
    }

    /**
     * 6. 分頁查詢特定商品的庫存異動日誌
     */
    @GetMapping("/logs/{productId}")
    public ResponseEntity<ApiResponse<Page<InventoryLog>>> getInventoryLogs(
            @PathVariable Long productId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLogsByProductId(productId, pageable)));
    }
}