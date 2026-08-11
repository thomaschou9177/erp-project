import { AppstoreOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import React, { useState } from 'react';
import { OrderPage } from './pages/OrderPage';
import { ProductPage } from './pages/ProductPage';

const { Header, Content, Footer, Sider } = Layout;

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('products');
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 32, margin: 16, color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
          ERP 企業系統
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['products']}
          onClick={(e) => setActiveTab(e.key)}
          items={[
            { key: 'products', icon: <AppstoreOutlined />, label: '商品主檔管理' },
            { key: 'orders', icon: <ShoppingOutlined />, label: '銷售訂單管理' },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            {activeTab === 'products' ? <ProductPage /> : <OrderPage />}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>ERP System ©2026 Created with React & Spring Boot</Footer>
      </Layout>
    </Layout>
  );
};

export default App;