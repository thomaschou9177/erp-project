package com.erp.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "客戶名稱不能為空")
    private String customerName;

    @NotEmpty(message = "訂單至少需包含一項商品")
    private List<OrderItemRequest> items;

    private String operator = "SYSTEM";
}