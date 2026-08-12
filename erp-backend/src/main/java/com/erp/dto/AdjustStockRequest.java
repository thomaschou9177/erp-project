package com.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdjustStockRequest {

    @NotNull(message = "商品 ID 不能為空")
    private Long productId;

    /**
     * 異動類型: INBOUND(進貨), OUTBOUND(出貨), ADJUST(盤點調整)
     */
    @NotBlank(message = "異動類型不能為空")
    private String changeType;

    @NotNull(message = "數量不能為空")
    @Min(value = 1, message = "數量必須大於 0")
    private Integer quantity;

    private String referenceNo;
    private String operator = "SYSTEM";
}