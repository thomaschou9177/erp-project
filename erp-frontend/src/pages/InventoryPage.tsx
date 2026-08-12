import { Button, Form, Input, InputNumber, message, Modal, Select, Space, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance'; // 請替換為您的 axios 實例路徑

interface InventoryItem {
  id: number;
  productId: number;
  stockQuantity: number;
  version: number;
  updatedAt: string;
}

const InventoryPage: React.FC = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [form] = Form.useForm();

  // 1. 取得所有庫存列表 (呼叫 GET /api/inventories)
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventories');
      setInventories(res.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || '取得庫存清單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 2. 開啟調整庫存 Modal
  const handleOpenModal = (record: InventoryItem) => {
    setSelectedItem(record);
    form.setFieldsValue({
      productId: record.productId,
      changeType: 'INBOUND',
      quantity: 1,
      referenceNo: '',
      operator: 'SYSTEM'
    });
    setIsModalOpen(true);
  };

  // 3. 送出庫存調整 (呼叫 POST /api/inventories/adjust)
  const handleAdjustSubmit = async (values: any) => {
    try {
      await api.post('/inventories/adjust', values);
      message.success('庫存調整成功');
      setIsModalOpen(false);
      fetchInventory(); // 重新整理列表
    } catch (err: any) {
      message.error(err.response?.data?.message || '庫存調整失敗');
    }
  };

  const columns = [
    { title: '庫存 ID', dataIndex: 'id', key: 'id' },
    { title: '商品 ID', dataIndex: 'productId', key: 'productId' },
    {
      title: '現有庫存量',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      render: (qty: number) => (
        <Space>
          <span style={{ fontWeight: 'bold', color: qty < 10 ? '#ff4d4f' : '#52c41a' }}>
            {qty}
          </span>
          {qty < 10 && <Tag color="red">偏低</Tag>}
        </Space>
      )
    },
    { title: '樂觀鎖版本 (Version)', dataIndex: 'version', key: 'version' },
    { title: '最後更新時間', dataIndex: 'updatedAt', key: 'updatedAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InventoryItem) => (
        <Button type="primary" size="small" onClick={() => handleOpenModal(record)}>
          調整庫存
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>現有庫存管理</h2>
      <Table 
        dataSource={inventories} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
      />

      {/* 調整庫存彈窗 */}
      <Modal
        title={`調整庫存 - 商品 ID: ${selectedItem?.productId}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAdjustSubmit}>
          <Form.Item name="productId" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="changeType" label="異動類型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="INBOUND">進貨 (INBOUND)</Select.Option>
              <Select.Option value="OUTBOUND">出貨 (OUTBOUND)</Select.Option>
              <Select.Option value="ADJUST">盤點校正 (ADJUST)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="quantity" label="數量" rules={[{ required: true, min: 1, message: '數量必須大於 0' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="referenceNo" label="關聯單據號碼">
            <Input placeholder="例：SO-20260812-001 或 PO-1002" />
          </Form.Item>

          <Form.Item name="operator" label="操作人員">
            <Input placeholder="預設 SYSTEM" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;