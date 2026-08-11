package com.erp.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.dto.CreateOrderRequest;
import com.erp.dto.OrderItemRequest;
import com.erp.entity.Product;
import com.erp.entity.SalesOrder;
import com.erp.entity.SalesOrderItem;
import com.erp.repository.ProductRepository;
import com.erp.repository.SalesOrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    // 每日單號遞增計數器與日期紀錄
    private static final AtomicInteger DAILY_COUNTER = new AtomicInteger(1);
    private static String currentDayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

    /**
     * 建立銷售訂單 (完整事務：算價、扣庫存、生成單據)
     */
    @Transactional
    public SalesOrder createOrder(CreateOrderRequest request) {
        String orderCode = generateOrderCode();
        BigDecimal totalOrderAmount = BigDecimal.ZERO;

        // 1. 建立訂單主檔實體
        SalesOrder order = SalesOrder.builder()
                .orderCode(orderCode)
                .customerName(request.getCustomerName())
                .status("COMPLETED")
                .build();

        // 2. 逐筆處理訂單明細、計算金額與扣減庫存
        for (OrderItemRequest itemReq : request.getItems()) {
            // (1) 查詢商品真實資訊與單價
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("找不到商品 ID: " + itemReq.getProductId()));

            if (!"ACTIVE".equals(product.getStatus())) {
                throw new IllegalStateException("商品 [" + product.getName() + "] 已下架，無法下單");
            }

            // (2) 計算明細小計金額 (單價 * 數量)
            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalOrderAmount = totalOrderAmount.add(subtotal);

            // (3) 呼叫庫存服務扣減庫存 (失敗會直接拋出例外並觸發本事務 Rollback)
            inventoryService.deductStock(
                    product.getId(),
                    itemReq.getQuantity(),
                    orderCode,
                    request.getOperator());

            // (4) 建立明細實體並加入主單
            SalesOrderItem orderItem = SalesOrderItem.builder()
                    .productId(product.getId())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(product.getPrice())
                    .subtotal(subtotal)
                    .build();

            order.addItem(orderItem);
        }

        // 3. 設定總金額並儲存訂單（Cascade 會自動儲存所有 items）
        order.setTotalAmount(totalOrderAmount);

        try {
            SalesOrder savedOrder = salesOrderRepository.save(order);
            log.info("訂單建立成功！單號: {}, 總金額: {}", savedOrder.getOrderCode(), savedOrder.getTotalAmount());
            return savedOrder;
        } catch (DataIntegrityViolationException e) {
            log.error("單號衝突或資料重複: {}", orderCode);
            throw new RuntimeException("訂單建立失敗，請重試");
        }
    }

    /**
     * 併發安全的單號生成器 (格式: SO-20260811-001)
     */
    private synchronized String generateOrderCode() {
        String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 跨日自動重置計數器為 1
        if (!todayStr.equals(currentDayStr)) {
            currentDayStr = todayStr;
            DAILY_COUNTER.set(1);
        }

        int sequence = DAILY_COUNTER.getAndIncrement();
        return String.format("SO-%s-%03d", todayStr, sequence);
    }
}