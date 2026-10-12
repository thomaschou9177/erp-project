// src/pages/OrderPage.tsx
import { MinusCircleOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

interface OrderItem {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: number;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

export const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [form] = Form.useForm();

  const fetchOrdersAndProducts = async () => {
    setLoading(true);
    try {
      const [orderRes, productRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products')
      ]);
      setOrders(orderRes.data.data || []);
      setProducts(productRes.data.data || []);
    } catch (error: any) {
      message.error('資料讀取失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndProducts();
  }, []);

  // 點擊訂單號碼查看詳情
  const handleOpenDetail = async (orderCode: string) => {
    try {
      const res = await api.get(`/orders/${orderCode}`);
      setSelectedOrder(res.data.data);
      setDetailModalOpen(true);
    } catch (error: any) {
      message.error('讀取訂單明細失敗');
    }
  };

  // 送出多商品下單 (符合 CreateOrderRequest DTO)
  const handleCreateOrder = async (values: any) => {
    try {
      const payload = {
        customerName: values.customerName,
        operator: values.operator || '前端操作員',
        items: values.items
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
    {
      title: '訂單號碼',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (text: string) => (
        <Typography.Link onClick={() => handleOpenDetail(text)} style={{ fontWeight: 500 }}>
          {text}
        </Typography.Link>
      )
    },
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

      {/* 新增銷售訂單 Modal */}
      <Modal
        title="建立新銷售訂單"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={650}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrder} initialValues={{ items: [{ quantity: 1 }] }}>
          <Form.Item name="customerName" label="客戶名稱" rules={[{ required: true, message: '請輸入客戶名稱' }]}>
            <Input placeholder="例如: 台積電" />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      rules={[{ required: true, message: '請選擇商品' }]}
                      style={{ width: 320 }}
                    >
                      <Select placeholder="選擇商品">
                        {products.map(p => (
                          <Select.Option key={p.id} value={p.id}>
                            {p.name} (${p.price})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '請輸入數量' }]}
                    >
                      <InputNumber min={1} placeholder="數量" style={{ width: 140 }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                    )}
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    增加商品品項
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 訂單詳情 Modal */}
      <Modal
        title={`訂單明細 - ${selectedOrder?.orderCode}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            確定
          </Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <p><strong>客戶名稱：</strong>{selectedOrder.customerName}</p>
            <p><strong>單據狀態：</strong><Tag color="blue">{selectedOrder.status}</Tag></p>
            <p><strong>總金額：</strong>${selectedOrder.totalAmount?.toLocaleString()}</p>
            <Table
              dataSource={selectedOrder.items || []}
              rowKey={(record) => record.id || record.productId}
              pagination={false}
              size="small"
              columns={[
                { title: '商品 ID', dataIndex: 'productId', key: 'productId' },
                { title: '數量', dataIndex: 'quantity', key: 'quantity' },
                { title: '單價', dataIndex: 'unitPrice', key: 'unitPrice', render: (val) => `$${val?.toLocaleString()}` },
                { title: '小計', dataIndex: 'subtotal', key: 'subtotal', render: (val) => `$${val?.toLocaleString()}` }
              ]}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};