import { Table, Tag, message } from 'antd';
import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

interface InventoryLog {
  id: number;
  productId: number;
  changeType: 'INBOUND' | 'OUTBOUND' | 'ADJUST';
  quantity: number;
  referenceNo: string;
  operator: string;
  createdAt: string;
}

const InventoryLogPage: React.FC = () => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // 分頁取得異動紀錄 (呼叫 GET /api/inventories/logs?page=0&size=10)
  const fetchLogs = async (page = 0, size = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/inventories/logs?page=${page}&size=${size}`);
      const pageData = res.data.data;
      
      setLogs(pageData.content || []);
      setPagination({
        current: pageData.number + 1, // Spring Page 從 0 開始，AntD Table 從 1 開始
        pageSize: pageData.size,
        total: pageData.totalElements
      });
    } catch (err: any) {
      message.error(err.response?.data?.message || '取得庫存異動紀錄失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0, pagination.pageSize);
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchLogs(newPagination.current - 1, newPagination.pageSize);
  };

  const columns = [
    { title: '流水號 ID', dataIndex: 'id', key: 'id' },
    { title: '商品 ID', dataIndex: 'productId', key: 'productId' },
    {
      title: '異動類型',
      dataIndex: 'changeType',
      key: 'changeType',
      render: (type: string) => {
        if (type === 'INBOUND') return <Tag color="green">進貨 (INBOUND)</Tag>;
        if (type === 'OUTBOUND') return <Tag color="volcano">出貨 (OUTBOUND)</Tag>;
        return <Tag color="blue">盤點校正 (ADJUST)</Tag>;
      }
    },
    {
      title: '變動數量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => (
        <span style={{ color: val > 0 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
          {val > 0 ? `+${val}` : val}
        </span>
      )
    },
    { title: '單據號碼', dataIndex: 'referenceNo', key: 'referenceNo', render: (txt: string) => txt || '-' },
    { title: '操作人員', dataIndex: 'operator', key: 'operator' },
    { title: '紀錄時間', dataIndex: 'createdAt', key: 'createdAt' }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>庫存進出貨異動紀錄 (Audit Trail)</h2>
      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default InventoryLogPage;