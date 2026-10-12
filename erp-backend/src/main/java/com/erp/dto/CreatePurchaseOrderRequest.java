// src/main/java/com/erp/dto/CreatePurchaseOrderRequest.java
package com.erp.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class CreatePurchaseOrderRequest {

    @NotBlank(message = "供應商名稱不能為空")
    private String supplierName;

    @NotEmpty(message = "採購單至少需包含一項商品")
    @Valid
    private List<PurchaseOrderItemRequest> items;

    private String purchaser = "SYSTEM";
}