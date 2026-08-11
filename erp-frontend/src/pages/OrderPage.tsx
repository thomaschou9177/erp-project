import { ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from 'antd';
import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

interface Order {
  id: number;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  const fetchOrdersAndProducts = async () => {
    setLoading(true);
    try {
      const [orderRes, productRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products')
      ]);
      setOrders(orderRes.data.data);
      setProducts(productRes.data.data);
    } catch (error: any) {
      message.error('資料讀取失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndProducts();
  }, []);

  // 送出下單 API
  const handleCreateOrder = async (values: any) => {
    try {
      const payload = {
        customerName: values.customerName,
        operator: '前端使用者',
        items: [
          {
            productId: values.productId,
            quantity: values.quantity
          }
        ]
      };
      await api.post('/orders', payload);
      message.success('訂單建立成功，庫存已自動扣減！');
      setIsModalOpen(false);
      form.resetFields();
      fetchOrdersAndProducts();
    } catch (error: any) {
      message.error(error.response?.data?.message || '下單失敗（可能庫存不足）');
    }
  };

  const columns = [
    { title: '訂單號碼', dataIndex: 'orderCode', key: 'orderCode' },
    { title: '客戶名稱', dataIndex: 'customerName', key: 'customerName' },
    { 
      title: '總金額', 
      dataIndex: 'totalAmount', 
      key: 'totalAmount',
      render: (amount: number) => `$${amount?.toLocaleString()}`
    },
    { 
      title: '單據狀態', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>
    },
    { title: '建立時間', dataIndex: 'createdAt', key: 'createdAt' }
  ];

  return (
    <Card title="銷售訂單管理" extra={
      <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => setIsModalOpen(true)}>
        新建銷售訂單
      </Button>
    }>
      <Table dataSource={orders} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 5 }} />

      <Modal
        title="建立新訂單"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item name="customerName" label="客戶名稱" rules={[{ required: true, message: '請輸入客戶名稱' }]}>
            <Input placeholder="例如: 台積電" />
          </Form.Item>
          <Form.Item name="productId" label="選擇商品" rules={[{ required: true, message: '請選擇商品' }]}>
            <Select placeholder="請選擇商品">
              {products.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name} (${p.price})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="購買數量" rules={[{ required: true, message: '請輸入數量' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};