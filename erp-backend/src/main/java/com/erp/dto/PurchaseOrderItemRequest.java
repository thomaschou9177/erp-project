// src/main/java/com/erp/dto/PurchaseOrderItemRequest.java
package com.erp.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PurchaseOrderItemRequest {

    @NotNull(message = "商品 ID 不能為空")
    private Long productId;

    @NotNull(message = "採購數量不能為空")
    @Min(value = 1, message = "採購數量至少為 1")
    private Integer quantity;

    @NotNull(message = "進貨單價不能為空")
    @DecimalMin(value = "0.01", message = "進貨單價必須大於 0")
    private BigDecimal unitPrice;
}