package com.erp.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.dto.AdjustStockRequest;
import com.erp.entity.Inventory;
import com.erp.entity.InventoryLog;
import com.erp.repository.InventoryLogRepository;
import com.erp.repository.InventoryRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryLogRepository inventoryLogRepository;

    // private static final int MAX_RETRIES = 3; // 樂觀鎖最大重試次數

    /**
     * 統一庫存調整入口 (依據 changeType 判斷處理邏輯)
     */
    @Transactional
    public Inventory adjustStock(AdjustStockRequest request) {
        String type = request.getChangeType().toUpperCase();
        switch (type) {
            case "INBOUND":
                return addStock(request.getProductId(), request.getQuantity(), request.getReferenceNo(),
                        request.getOperator());
            case "OUTBOUND":
                return deductStock(request.getProductId(), request.getQuantity(), request.getReferenceNo(),
                        request.getOperator());
            case "ADJUST":
                return forceAdjustStock(request.getProductId(), request.getQuantity(), request.getReferenceNo(),
                        request.getOperator());
            default:
                throw new IllegalArgumentException("未知的異動類型: " + request.getChangeType());
        }
    }

    /**
     * 庫存扣減 (使用悲觀鎖悲觀鎖/FOR UPDATE，避免樂觀鎖在同一 Transaction 內 Retry 失敗問題)
     */
    @Transactional
    public Inventory deductStock(Long productId, Integer quantity, String referenceNo, String operator) {
        // 使用在 Repository 建立的悲觀鎖查詢，確保高併發時扣減不超賣且不用寫複雜 retry 迴圈
        Inventory inventory = inventoryRepository.findByProductIdWithLock(productId)
                .orElseThrow(() -> new IllegalArgumentException("找不到商品 ID: " + productId + " 的庫存紀錄"));

        if (inventory.getStockQuantity() < quantity) {
            throw new IllegalStateException(
                    "庫存不足！當前庫存: " + inventory.getStockQuantity() + ", 欲扣減數量: " + quantity);
        }

        inventory.setStockQuantity(inventory.getStockQuantity() - quantity);
        Inventory savedInventory = inventoryRepository.save(inventory);

        // 寫入庫存異動日誌 (Audit Trail)
        InventoryLog logRecord = InventoryLog.builder()
                .productId(productId)
                .changeType("OUTBOUND")
                .quantity(-quantity)
                .referenceNo(referenceNo)
                .operator(operator != null ? operator : "SYSTEM")
                .build();
        inventoryLogRepository.save(logRecord);

        log.info("庫存扣減成功 - 商品 ID: {}, 扣減數量: {}, 剩餘庫存: {}", productId, quantity, inventory.getStockQuantity());
        return savedInventory;
    }

    /**
     * 進貨 / 增加庫存
     */
    @Transactional
    public Inventory addStock(Long productId, Integer quantity, String referenceNo, String operator) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseGet(() -> Inventory.builder()
                        .productId(productId)
                        .stockQuantity(0)
                        .build());

        inventory.setStockQuantity(inventory.getStockQuantity() + quantity);
        Inventory savedInventory = inventoryRepository.save(inventory);

        InventoryLog logRecord = InventoryLog.builder()
                .productId(productId)
                .changeType("INBOUND")
                .quantity(quantity)
                .referenceNo(referenceNo)
                .operator(operator != null ? operator : "SYSTEM")
                .build();
        inventoryLogRepository.save(logRecord);

        log.info("庫存增加成功 - 商品 ID: {}, 增加數量: {}, 當前庫存: {}", productId, quantity, savedInventory.getStockQuantity());
        return savedInventory;
    }

    /**
     * 盤點校正 (直接設定或調整庫存)
     */
    @Transactional
    public Inventory forceAdjustStock(Long productId, Integer targetQuantity, String referenceNo, String operator) {
        Inventory inventory = inventoryRepository.findByProductIdWithLock(productId)
                .orElseGet(() -> Inventory.builder()
                        .productId(productId)
                        .stockQuantity(0)
                        .build());

        int diff = targetQuantity - inventory.getStockQuantity();
        inventory.setStockQuantity(targetQuantity);
        Inventory savedInventory = inventoryRepository.save(inventory);

        InventoryLog logRecord = InventoryLog.builder()
                .productId(productId)
                .changeType("ADJUST")
                .quantity(diff)
                .referenceNo(referenceNo)
                .operator(operator != null ? operator : "SYSTEM")
                .build();
        inventoryLogRepository.save(logRecord);

        return savedInventory;
    }

    // ================= 查詢 API =================

    /**
     * 分頁查詢所有庫存異動紀錄
     */
    @Transactional(readOnly = true)
    public Page<InventoryLog> getAllLogs(Pageable pageable) {
        return inventoryLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    /**
     * 分頁查詢指定商品的庫存異動紀錄
     */
    @Transactional(readOnly = true)
    public Page<InventoryLog> getLogsByProductId(Long productId, Pageable pageable) {
        return inventoryLogRepository.findByProductId(productId, pageable);
    }
}