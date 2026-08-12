package com.erp.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.erp.entity.InventoryLog;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    // 不分頁：取得單一商品的所有異動 (適合小量數據)
    List<InventoryLog> findByProductIdOrderByCreatedAtDesc(Long productId);

    // 分頁：取得單一商品的異動紀錄 (推薦實務使用)
    Page<InventoryLog> findByProductId(Long productId, Pageable pageable);

    // 分頁：取得系統所有異動紀錄
    Page<InventoryLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}