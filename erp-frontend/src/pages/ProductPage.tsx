import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Table, Tag, message } from 'antd';
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
          <Form.Item name="price" label="單價" rules={[{ required: true, message: '請輸入單價' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="例如: 1200" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};