package com.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdjustStockRequest {

    @NotNull(message = "商品 ID 不能為空")
    private Long productId;

    @NotNull(message = "數量不能為空")
    @Min(value = 1, message = "數量必須大於 0")
    private Integer quantity;

    private String referenceNo;
    private String operator = "SYSTEM";
}