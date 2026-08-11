package com.erp.entity;

import java.time.OffsetDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory_logs", indexes = {
        @Index(name = "idx_inventory_logs_product_id", columnList = "product_id"),
        @Index(name = "idx_inventory_logs_reference_no", columnList = "reference_no")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    /**
     * 異動類型: INBOUND(進貨), OUTBOUND(出貨), ADJUST(調整)
     */
    @Column(name = "change_type", nullable = false, length = 20)
    private String changeType;

    /**
     * 異動數量 (可正可負)
     */
    @Column(nullable = false)
    private Integer quantity;

    /**
     * 關聯單據號碼 (例如銷售單號 SO-20260811-001)
     */
    @Column(name = "reference_no", length = 64)
    private String referenceNo;

    @Builder.Default
    @Column(length = 64)
    private String operator = "SYSTEM";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}