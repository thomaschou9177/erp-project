package com.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemRequest {

    @NotNull(message = "商品 ID 不能為空")
    private Long productId;

    @NotNull(message = "購買數量不能為空")
    @Min(value = 1, message = "購買數量至少為 1")
    private Integer quantity;
}