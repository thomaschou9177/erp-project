import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, message, Modal, Switch, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  status: string;
}

export const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  // 取得商品清單
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || '讀取商品清單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 新增商品 Submit
  const handleCreateProduct = async (values: any) => {
    try {
      await api.post('/products', { ...values, status: 'ACTIVE' });
      message.success('商品新增成功！');
      setIsModalOpen(false);
      form.resetFields();
      fetchProducts();
    } catch (error: any) {
      message.error(error.response?.data?.message || '新增商品失敗');
    }
  };

  const handleToggleStatus = async (id: number, checked: boolean) => {
    // 這裡的 'ACTIVE' / 'INACTIVE' 請根據你後端 Entity 的定義進行修改
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE'; 
    
    try {
      // 假設你的後端有提供 PUT 或 PATCH 更新狀態的 API
      await api.put(`/products/${id}/status`, { status: newStatus });
      message.success('狀態更新成功');
      
      // 更新成功後重新取得列表資料，讓畫面刷新
      // fetchProducts(); 

      // 僅更新該筆資料的 status，保持原本陣列順序不變
      setProducts(prevProducts =>
        prevProducts.map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      message.error('狀態更新失敗，請檢查後端連線');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'SKU 編號', dataIndex: 'sku', key: 'sku' },
    { title: '商品名稱', dataIndex: 'name', key: 'name' },
    { 
      title: '單價 (NT$)', 
      dataIndex: 'price', 
      key: 'price',
      render: (price: number) => `$${price.toLocaleString()}`
    },
    { 
      title: '狀態', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '上架中' : '已下架'}
        </Tag>
      )
    },
    // ▼▼▼ 新增這個操作欄位 ▼▼▼
  {
    title: '操作',
    key: 'action',
    render: (_: any, record: any) => (
      <Switch
        // 判斷開關是否為開啟狀態
        checked={record.status === 'ACTIVE' || record.status === '上架中'}
        // 點擊時觸發 API
        onChange={(checked) => handleToggleStatus(record.id, checked)}
        checkedChildren="上架"
        unCheckedChildren="下架"
      />
    ),
  },
  ];

  return (
    <Card title="商品管理" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
        新增商品
      </Button>
    }>
      <Table dataSource={products} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />

      <Modal
        title="新增商品"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProduct}>
          <Form.Item name="sku" label="SKU 編號" rules={[{ required: true, message: '請輸入 SKU' }]}>
            <Input placeholder="例如: PROD-2026-001" />
          </Form.Item>
          <Form.Item name="name" label="商品名稱" rules={[{ required: true, message: '請輸入商品名稱' }]}>
            <Input placeholder="例如: 無線滑鼠" />
          </Form.Item>
          <Form.Item name="price" label="單價" rules={[
                    { required: true, message: '請輸入商品單價' },
                    // 加入 type 與 min 驗證，當輸入小於 1 時會跳出紅字警告
                    { type: 'number', min: 0.01, message: '單價必須大於 0.01，不可為負數或零' }
                  ]}>
            <InputNumber style={{ width: '100%' }} placeholder="例如: 1200" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};