package com.erp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.entity.Product;
import com.erp.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public Product updateStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("找不到該商品 ID: " + id));

        product.setStatus(status);
        return productRepository.save(product);
    }
}