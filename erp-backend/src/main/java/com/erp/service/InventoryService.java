package com.erp.service;

import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private static final int MAX_RETRIES = 3; // 樂觀鎖最大重試次數

    /**
     * 庫存扣減 (含樂觀鎖重試與審計日誌)
     */
    @Transactional
    public void deductStock(Long productId, Integer quantity, String referenceNo, String operator) {
        int retryCount = 0;

        while (true) {
            try {
                // 1. 查詢庫存
                Inventory inventory = inventoryRepository.findByProductId(productId)
                        .orElseThrow(() -> new IllegalArgumentException("找不到商品 ID: " + productId + " 的庫存紀錄"));

                // 2. 檢查庫存數量
                if (inventory.getStockQuantity() < quantity) {
                    throw new IllegalStateException(
                            "庫存不足！當前庫存: " + inventory.getStockQuantity() + ", 欲扣減數量: " + quantity);
                }

                // 3. 扣減庫存 (JPA @Version 會在 commit 時檢查版本號)
                inventory.setStockQuantity(inventory.getStockQuantity() - quantity);
                inventoryRepository.saveAndFlush(inventory);

                // 4. 寫入庫存異動日誌 (Audit Trail)
                InventoryLog logRecord = InventoryLog.builder()
                        .productId(productId)
                        .changeType("OUTBOUND")
                        .quantity(-quantity)
                        .referenceNo(referenceNo)
                        .operator(operator != null ? operator : "SYSTEM")
                        .build();
                inventoryLogRepository.save(logRecord);

                log.info("庫存扣減成功 - 商品 ID: {}, 扣減數量: {}, 剩餘庫存: {}", productId, quantity, inventory.getStockQuantity());
                break; // 執行成功，跳出重試迴圈

            } catch (ObjectOptimisticLockingFailureException e) {
                retryCount++;
                log.warn("併發衝突，進行第 {} 次樂觀鎖重試... 商品 ID: {}", retryCount, productId);
                if (retryCount >= MAX_RETRIES) {
                    throw new RuntimeException("系統繁忙（併發衝突），請重新嘗試操作");
                }
                try {
                    Thread.sleep(50); // 隨機延遲 50ms 再重試
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    /**
     * 進貨 / 增加庫存
     */
    @Transactional
    public void addStock(Long productId, Integer quantity, String referenceNo, String operator) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseGet(() -> Inventory.builder()
                        .productId(productId)
                        .stockQuantity(0)
                        .build());

        inventory.setStockQuantity(inventory.getStockQuantity() + quantity);
        inventoryRepository.save(inventory);

        InventoryLog logRecord = InventoryLog.builder()
                .productId(productId)
                .changeType("INBOUND")
                .quantity(quantity)
                .referenceNo(referenceNo)
                .operator(operator != null ? operator : "SYSTEM")
                .build();
        inventoryLogRepository.save(logRecord);
    }
}