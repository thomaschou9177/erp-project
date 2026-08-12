package com.erp.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.entity.Inventory;
import com.erp.entity.Product;
import com.erp.repository.InventoryRepository;
import com.erp.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    /**
     * 更新商品上下架狀態
     */
    @Transactional
    public Product updateStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到該商品 ID: " + id));

        product.setStatus(status);
        return productRepository.save(product);
    }

    /**
     * 新增商品 (同時為該商品初始化一筆庫存紀錄)
     */
    @Transactional
    public Product createProduct(Product product) {
        Product savedProduct = productRepository.save(product);

        // 若庫存表無資料，自動初始化庫存為 0
        inventoryRepository.findByProductId(savedProduct.getId())
                .orElseGet(() -> {
                    Inventory newInv = Inventory.builder()
                            .productId(savedProduct.getId())
                            .stockQuantity(0)
                            .build();
                    return inventoryRepository.save(newInv);
                });

        return savedProduct;
    }
}