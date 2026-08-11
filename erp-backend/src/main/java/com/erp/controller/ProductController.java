package com.erp.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.dto.ApiResponse;
import com.erp.entity.Product;
import com.erp.repository.ProductRepository;
import com.erp.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getAllProducts() {
        return ResponseEntity.ok(ApiResponse.success(productRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("找不到商品 ID: " + id));
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody Product product) {
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.success("商品新增成功", savedProduct));
    }

    // ▼▼▼ 新增這個更新狀態的 API Endpoint ▼▼▼
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateProductStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusMap) {

        String newStatus = statusMap.get("status");

        // 呼叫 Service 更新狀態（若無 Service，也可直接呼叫 repository.findById(id) 修改後 save）
        Product updatedProduct = productService.updateStatus(id, newStatus);

        return ResponseEntity.ok(updatedProduct);
    }
}