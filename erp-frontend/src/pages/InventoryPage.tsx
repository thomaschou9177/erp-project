import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

interface InventoryItem {
  id: number;
  productId: number;
  stockQuantity: number;
  version: number;
  updatedAt: string;
}

export const InventoryPage: React.FC = () => {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // 1. 取得所有庫存列表
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

  // 2. 開啟 Modal (傳入 record 代表調整現有商品；不傳代表主動新增/初始化庫存)
  const handleOpenModal = (record?: InventoryItem) => {
    if (record) {
      setSelectedProductId(record.productId);
      form.setFieldsValue({
        productId: record.productId,
        changeType: 'INBOUND',
        quantity: 10,
        referenceNo: '',
        operator: 'SYSTEM'
      });
    } else {
      setSelectedProductId(null);
      form.resetFields();
      form.setFieldsValue({
        changeType: 'INBOUND',
        quantity: 10,
        operator: 'SYSTEM'
      });
    }
    setIsModalOpen(true);
  };

  // 3. 送出庫存調整
  const handleAdjustSubmit = async (values: any) => {
    try {
      await api.post('/inventories/adjust', values);
      message.success('庫存更新成功');
      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      message.error(err.response?.data?.message || '庫存更新失敗');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>現有庫存管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          新增 / 進貨庫存
        </Button>
      </div>

      <Table 
        dataSource={inventories} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
      />

      <Modal
        title={selectedProductId ? `調整庫存 - 商品 ID: ${selectedProductId}` : '新增 / 初始化商品庫存'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAdjustSubmit}>
          <Form.Item
            name="productId"
            label="商品 ID"
            rules={[{ required: true, message: '請輸入商品 ID' }]}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              placeholder="請輸入商品 ID (例如: 2)" 
              disabled={!!selectedProductId} 
            />
          </Form.Item>

          <Form.Item name="changeType" label="異動類型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="INBOUND">進貨 (INBOUND)</Select.Option>
              <Select.Option value="OUTBOUND">出貨 (OUTBOUND)</Select.Option>
              <Select.Option value="ADJUST">盤點校正 (ADJUST)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="quantity" label="數量" rules={[
            { required: true, message: '請輸入數量' },
            { type: 'number', min: 1, message: '數量必須大於 0' } // 加上 type: 'number'
          ]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="referenceNo" label="關聯單據號碼">
            <Input placeholder="例：PO-20260812-001" />
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