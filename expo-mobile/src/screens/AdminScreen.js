import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import BackHeader from '../components/BackHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiClient';
import PrimaryButton from '../components/PrimaryButton';

const tabs = [
  { key: 'dashboard', label: 'Tổng quan' },
  { key: 'order-status', label: 'Trạng thái' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'users', label: 'Người dùng' },
  { key: 'logs', label: 'Nhật ký' },
  { key: 'products', label: 'Sản phẩm' },
];

export default function AdminScreen({ navigation }) {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState({ loading: true });
  const [userPage, setUserPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedDeleteItem, setSelectedDeleteItem] = useState(null); // { type: 'user'|'product', id, name }
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', phone: '', role: 'USER' });
  const [newProduct, setNewProduct] = useState({ name: '', desc: '', price: '', stock: '', categoryId: '' });
  const [editOrderStatus, setEditOrderStatus] = useState('');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ users: { total: 0, totalPages: 1 }, orders: { total: 0, totalPages: 1 } });
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role?.toUpperCase().includes('ADMIN');

  const loadTab = async (tabKey = activeTab) => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      setState((current) => ({ ...current, loading: true }));

      if (tabKey === 'dashboard') {
        const response = await apiFetch('/admin/dashboard', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({
          ...current,
          dashboard: payload || {},
          loading: false,
        }));
        return;
      }

      if (tabKey === 'order-status') {
        const response = await apiFetch('/admin/orders/status/stats', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({
          ...current,
          orderStatuses: payload?.statuses || [],
          loading: false,
        }));
        return;
      }

      if (tabKey === 'orders') {
        const response = await apiFetch(`/admin/orders?page=${orderPage}&limit=10`, { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({ ...current, orders: payload?.orders || payload || [], loading: false }));
        setPagination((curr) => ({
          ...curr,
          orders: {
            total: payload?.pagination?.total || 0,
            totalPages: payload?.pagination?.totalPages || 1,
          },
        }));
        return;
      }

      if (tabKey === 'users') {
        const response = await apiFetch(`/admin/users?page=${userPage}&limit=10`, { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({ ...current, users: payload?.users || payload || [], loading: false }));
        setPagination((curr) => ({
          ...curr,
          users: {
            total: payload?.pagination?.total || 0,
            totalPages: payload?.pagination?.totalPages || 1,
          },
        }));
        return;
      }

      if (tabKey === 'logs') {
        const response = await apiFetch('/admin/audit-logs?page=0&size=20', { token });
        const data = await response.json();
        const payload = data?.data ?? data;
        setState((current) => ({ ...current, logs: payload?.content || payload?.logs || payload || [], loading: false }));
        return;
      }

      if (tabKey === 'products') {
        const response = await apiFetch('/products?page=1&limit=20');
        if (!response.ok) throw new Error('Không thể tải sản phẩm');
        const data = await response.json();
        const payload = data?.data ?? data;
        console.log('Products payload:', payload);
        setState((current) => ({ ...current, products: Array.isArray(payload) ? payload : payload?.products || [], loading: false }));

        // Load categories for product creation
        const catResponse = await apiFetch('/products/categories');
        if (!catResponse.ok) throw new Error('Không thể tải danh mục');
        const catData = await catResponse.json();
        const catPayload = catData?.data ?? catData;
        console.log('Categories payload:', catPayload);
        setCategories(Array.isArray(catPayload) ? catPayload : catPayload?.categories || []);
        return;
      }
    } catch {
      setState((current) => ({ ...current, loading: false }));
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) return;
    loadTab(activeTab);
  }, [activeTab, token, isAdmin, userPage, orderPage]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.email.includes('@')) {
      alert('Email không hợp lệ');
      return;
    }
    if (!newUser.password || newUser.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (!newUser.fullName || newUser.fullName.trim() === '') {
      alert('Tên đầy đủ không được trống');
      return;
    }
    
    try {
      const response = await apiFetch('/admin/users', {
        method: 'POST',
        body: newUser,
        token,
      });
      
      if (response.ok) {
        alert('Tạo người dùng thành công');
        setShowCreateUserModal(false);
        setNewUser({ email: '', password: '', fullName: '', phone: '', role: 'USER' });
        loadTab('users');
      } else {
        const error = await response.json();
        alert(error.message || 'Tạo người dùng thất bại');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleEditOrderStatus = async () => {
    if (!selectedOrder || !editOrderStatus) {
      alert('Vui lòng chọn trạng thái');
      return;
    }

    try {
      const response = await apiFetch(`/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        body: { status: editOrderStatus },
        token,
      });

      if (response.ok) {
        alert('Cập nhật trạng thái thành công');
        setShowEditOrderModal(false);
        setSelectedOrder(null);
        setEditOrderStatus('');
        loadTab('orders');
      } else {
        const error = await response.json();
        alert(error.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || newProduct.name.trim() === '') {
      alert('Tên sản phẩm không được trống');
      return;
    }
    if (!newProduct.price || isNaN(parseFloat(newProduct.price)) || parseFloat(newProduct.price) <= 0) {
      alert('Giá phải là số dương');
      return;
    }
    if (!newProduct.categoryId) {
      alert('Vui lòng chọn danh mục');
      return;
    }
    if (newProduct.stock && (isNaN(parseInt(newProduct.stock)) || parseInt(newProduct.stock) < 0)) {
      alert('Số lượng phải là số >= 0');
      return;
    }

    try {
      const response = await apiFetch('/admin/products', {
        method: 'POST',
        body: {
          name: newProduct.name,
          desc: newProduct.desc,
          price: parseFloat(newProduct.price),
          stock: newProduct.stock ? parseInt(newProduct.stock) : 0,
          categoryId: parseInt(newProduct.categoryId),
          image: newProduct.image || null,
        },
        token,
      });

      if (response.ok) {
        alert('Tạo sản phẩm thành công');
        setShowCreateProductModal(false);
        setNewProduct({ name: '', desc: '', price: '', stock: '', categoryId: '' });
        loadTab('products');
      } else {
        const error = await response.json();
        alert(error.message || 'Tạo sản phẩm thất bại');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedDeleteItem) {
      alert('Không có mục nào được chọn');
      return;
    }

    try {
      let endpoint = '';
      if (selectedDeleteItem.type === 'user') {
        endpoint = `/admin/users/${selectedDeleteItem.id}`;
      } else if (selectedDeleteItem.type === 'product') {
        endpoint = `/admin/products/${selectedDeleteItem.id}`;
      }

      const response = await apiFetch(endpoint, {
        method: 'DELETE',
        token,
      });

      if (response.ok) {
        alert(`Xóa ${selectedDeleteItem.type === 'user' ? 'người dùng' : 'sản phẩm'} thành công`);
        setShowDeleteConfirmModal(false);
        setSelectedDeleteItem(null);
        loadTab(selectedDeleteItem.type === 'user' ? 'users' : 'products');
      } else {
        const error = await response.json();
        alert(error.message || 'Xóa thất bại');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      id: user.id,
      fullName: user.fullName || '',
      phone: user.phone || '',
      role: user.role || 'USER',
      isActive: user.isActive !== false,
    });
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    if (!editingUser.fullName || editingUser.fullName.trim() === '') {
      alert('Tên đầy đủ không được trống');
      return;
    }

    try {
      const response = await apiFetch(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: {
          fullName: editingUser.fullName,
          phone: editingUser.phone,
          role: editingUser.role,
          isActive: editingUser.isActive,
        },
        token,
      });

      if (response.ok) {
        alert('Cập nhật người dùng thành công');
        setShowEditUserModal(false);
        setEditingUser(null);
        loadTab('users');
      } else {
        const error = await response.json();
        alert(error.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      id: product.id,
      name: product.name || '',
      desc: product.desc || '',
      price: String(product.price || ''),
      stock: String(product.stock ?? product.quantum ?? ''),
      categoryId: String(product.categoryId || product.category?.id || ''),
    });
    setShowEditProductModal(true);
  };

  const handleSaveEditProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name || editingProduct.name.trim() === '') {
      alert('Tên sản phẩm không được trống');
      return;
    }
    if (!editingProduct.price || isNaN(parseFloat(editingProduct.price)) || parseFloat(editingProduct.price) <= 0) {
      alert('Giá phải là số dương');
      return;
    }
    if (editingProduct.stock && (isNaN(parseInt(editingProduct.stock)) || parseInt(editingProduct.stock) < 0)) {
      alert('Số lượng phải là số >= 0');
      return;
    }

    try {
      const response = await apiFetch(`/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        body: {
          name: editingProduct.name,
          desc: editingProduct.desc,
          price: parseFloat(editingProduct.price),
          stock: editingProduct.stock ? parseInt(editingProduct.stock) : 0,
          image: editingProduct.image || null,
        },
        token,
      });

      if (response.ok) {
        alert('Cập nhật sản phẩm thành công');
        setShowEditProductModal(false);
        setEditingProduct(null);
        loadTab('products');
      } else {
        const error = await response.json();
        alert(error.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.title}>Quản trị</Text>
        <Text style={styles.denied}>Bạn không có quyền truy cập trang này.</Text>
        <PrimaryButton label="Về trang chủ" onPress={() => navigation.navigate('Home')} />
      </View>
    );
  }

  const summary = state.summary || {};
  const dashboard = state.dashboard || {};

  return (
    <View style={styles.screenWrapper}>
      <View style={[styles.statusBarPlaceholder, { height: insets.top }]} />
      <BackHeader title="Quản trị" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>MANAGEMENT TERMINAL</Text>
      <Text style={styles.title}>Quản trị hệ thống</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {state.loading ? <Text style={styles.muted}>Đang tải dữ liệu...</Text> : null}

      {activeTab === 'dashboard' ? (
        <View style={styles.card}>
          <Row label="Tổng người dùng" value={String(dashboard.totalUsers || 0)} />
          <Row label="Tổng đơn hàng" value={String(dashboard.totalOrders || 0)} />
          <Row label="Đơn hàng chờ xử lý" value={String(dashboard.pendingOrders || 0)} />
          <Row label="Tổng sản phẩm" value={String(dashboard.totalProducts || 0)} />
          <Row label="Doanh thu tháng" value={Number(dashboard.monthlyRevenue || 0).toLocaleString('vi-VN') + 'đ'} />
        </View>
      ) : null}

      {activeTab === 'revenue' ? (
        <>
          <View style={styles.card}>
            <Row label="Tổng doanh thu" value={Number(summary.totalRevenue || 0).toLocaleString('vi-VN') + 'đ'} />
            <Row label="Tổng đơn hàng (tháng)" value={String(summary.totalOrders || 0)} />
            <Row label="Đơn hàng hoàn thành" value={String(summary.deliveredOrdersCount || 0)} />
            <Row label="Giá trị TB (hoàn thành)" value={Number(summary.averageOrderValue || 0).toLocaleString('vi-VN') + 'đ'} />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Doanh thu theo ngày</Text>
            <RevenueChart data={state.revenue || []} />
          </View>
        </>
      ) : null}

      {activeTab === 'order-status' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thống kê trạng thái đơn hàng</Text>
          <OrderStatusChart data={state.orderStatuses || []} />
        </View>
      ) : null}

      {activeTab === 'orders'
        ? (state.orders || []).map((order) => (
            <Pressable
              key={order.id}
              onPress={() => {
                setSelectedOrder(order);
                setEditOrderStatus(order.status);
                setShowEditOrderModal(true);
              }}
              style={styles.card}
            >
              <MiniCard title={`Đơn #${order.id}`} lines={[`Trạng thái: ${order.status}`, `Tổng tiền: ${Number(order.totalPrice || 0).toLocaleString('vi-VN')}đ`, order.shippingAddr || '-', 'Nhấn để chỉnh sửa']} />
            </Pressable>
          ))
        : null}
      
      {activeTab === 'orders' && pagination.orders.totalPages > 1 ? (
        <View style={styles.paginationContainer}>
          <Pressable
            disabled={orderPage === 1}
            onPress={() => setOrderPage(Math.max(1, orderPage - 1))}
            style={[styles.paginationBtn, orderPage === 1 && styles.paginationBtnDisabled]}
          >
            <Text style={styles.paginationBtnText}>← Trang trước</Text>
          </Pressable>
          <Text style={styles.paginationText}>{orderPage} / {pagination.orders.totalPages}</Text>
          <Pressable
            disabled={orderPage >= pagination.orders.totalPages}
            onPress={() => setOrderPage(Math.min(pagination.orders.totalPages, orderPage + 1))}
            style={[styles.paginationBtn, orderPage >= pagination.orders.totalPages && styles.paginationBtnDisabled]}
          >
            <Text style={styles.paginationBtnText}>Trang sau →</Text>
          </Pressable>
        </View>
      ) : null}

      {activeTab === 'users' ? (
        <>
          <PrimaryButton label="Tạo người dùng mới" onPress={() => setShowCreateUserModal(true)} />
          {(state.users || []).map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => handleEditUser(item)}
            >
              <MiniCard title={item.fullName || item.email} lines={[item.email, item.role, item.phone || '-', 'Nhấn để chỉnh sửa']} />
            </Pressable>
          ))}
        </>
      ) : null}
      
      {activeTab === 'users' && pagination.users.totalPages > 1 ? (
        <View style={styles.paginationContainer}>
          <Pressable
            disabled={userPage === 1}
            onPress={() => setUserPage(Math.max(1, userPage - 1))}
            style={[styles.paginationBtn, userPage === 1 && styles.paginationBtnDisabled]}
          >
            <Text style={styles.paginationBtnText}>← Trang trước</Text>
          </Pressable>
          <Text style={styles.paginationText}>{userPage} / {pagination.users.totalPages}</Text>
          <Pressable
            disabled={userPage >= pagination.users.totalPages}
            onPress={() => setUserPage(Math.min(pagination.users.totalPages, userPage + 1))}
            style={[styles.paginationBtn, userPage >= pagination.users.totalPages && styles.paginationBtnDisabled]}
          >
            <Text style={styles.paginationBtnText}>Trang sau →</Text>
          </Pressable>
        </View>
      ) : null}

      {activeTab === 'logs'
        ? (state.logs || []).map((item) => <MiniCard key={item.id} title={`${item.action} • ${item.entity}`} lines={[`Người dùng: ${item.userId || '-'}`, `Thời gian: ${item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}`]} />)
        : null}

      {activeTab === 'products'
        ? (
          <>
            <PrimaryButton label="Tạo sản phẩm mới" onPress={() => setShowCreateProductModal(true)} />
            {(state.products || []).map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => handleEditProduct(item)}
              >
                <MiniCard title={item.name} lines={[item.category?.name || item.category || '-', `${Number(item.price || 0).toLocaleString('vi-VN')}đ`, `Tồn kho: ${item.stock ?? item.quantum ?? '-'}`, 'Nhấn để chỉnh sửa']} />
              </Pressable>
            ))}
          </>
        )
        : null}

      <PrimaryButton label="Về trang chủ" variant="secondary" onPress={() => navigation.navigate('Home')} />
    </ScrollView>

    {showCreateUserModal ? (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tạo người dùng mới</Text>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={newUser.email}
            onChangeText={(text) => setNewUser({...newUser, email: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={newUser.password}
            onChangeText={(text) => setNewUser({...newUser, password: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Tên đầy đủ</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            value={newUser.fullName}
            onChangeText={(text) => setNewUser({...newUser, fullName: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="0123456789"
            value={newUser.phone}
            onChangeText={(text) => setNewUser({...newUser, phone: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Vai trò</Text>
          <View style={styles.roleContainer}>
            {['USER', 'ADMIN'].map((role) => (
              <Pressable
                key={role}
                onPress={() => setNewUser({...newUser, role})}
                style={[styles.roleBtn, newUser.role === role && styles.roleBtnActive]}
              >
                <Text style={[styles.roleBtnText, newUser.role === role && styles.roleBtnTextActive]}>{role}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.modalActions}>
            <PrimaryButton label="Tạo" onPress={handleCreateUser} />
            <PrimaryButton label="Đóng" variant="secondary" onPress={() => {
              setShowCreateUserModal(false);
              setNewUser({ email: '', password: '', fullName: '', phone: '', role: 'USER' });
            }} />
          </View>
          </ScrollView>
        </View>
      </View>
    ) : null}

    {showEditUserModal && editingUser ? (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chỉnh sửa người dùng</Text>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.inputLabel}>Email</Text>
          <Text style={styles.emailDisplay}>{editingUser.email}</Text>

          <Text style={styles.inputLabel}>Tên đầy đủ</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            value={editingUser.fullName}
            onChangeText={(text) => setEditingUser({...editingUser, fullName: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="0123456789"
            value={editingUser.phone}
            onChangeText={(text) => setEditingUser({...editingUser, phone: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Vai trò</Text>
          <View style={styles.roleContainer}>
            {['USER', 'ADMIN'].map((role) => (
              <Pressable
                key={role}
                onPress={() => setEditingUser({...editingUser, role})}
                style={[styles.roleBtn, editingUser.role === role && styles.roleBtnActive]}
              >
                <Text style={[styles.roleBtnText, editingUser.role === role && styles.roleBtnTextActive]}>{role}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Trạng thái</Text>
          <View style={styles.roleContainer}>
            {[{ label: 'Hoạt động', value: true }, { label: 'Vô hiệu', value: false }].map((item) => (
              <Pressable
                key={String(item.value)}
                onPress={() => setEditingUser({...editingUser, isActive: item.value})}
                style={[styles.roleBtn, editingUser.isActive === item.value && styles.roleBtnActive]}
              >
                <Text style={[styles.roleBtnText, editingUser.isActive === item.value && styles.roleBtnTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.modalActions}>
            <PrimaryButton label="Lưu" onPress={handleSaveEditUser} />
            <PrimaryButton label="Xóa" variant="danger" onPress={() => {
              setSelectedDeleteItem({ type: 'user', id: editingUser.id, name: editingUser.fullName });
              setShowEditUserModal(false);
              setShowDeleteConfirmModal(true);
            }} />
            <PrimaryButton label="Đóng" variant="secondary" onPress={() => {
              setShowEditUserModal(false);
              setEditingUser(null);
            }} />
          </View>
          </ScrollView>
        </View>
      </View>
    ) : null}

    {showEditOrderModal && selectedOrder ? (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cập nhật trạng thái đơn hàng</Text>
          <Text style={styles.inputLabel}>Đơn hàng #{selectedOrder.id}</Text>

          <View style={styles.statusGrid}>
            {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
              <Pressable
                key={status}
                onPress={() => setEditOrderStatus(status)}
                style={[styles.statusBtn, editOrderStatus === status && styles.statusBtnActive]}
              >
                <Text style={[styles.statusBtnText, editOrderStatus === status && styles.statusBtnTextActive]}>
                  {status === 'PENDING' ? 'Chờ duyệt' : status === 'CONFIRMED' ? 'Đã xác nhận' : status === 'SHIPPED' ? 'Đang giao' : status === 'DELIVERED' ? 'Đã giao' : 'Đã hủy'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.modalActions}>
            <PrimaryButton label="Cập nhật" onPress={handleEditOrderStatus} />
            <PrimaryButton label="Đóng" variant="secondary" onPress={() => {
              setShowEditOrderModal(false);
              setSelectedOrder(null);
              setEditOrderStatus('');
            }} />
          </View>
        </View>
      </View>
    ) : null}

    {showCreateProductModal ? (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Tạo sản phẩm mới</Text>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.inputLabel}>Tên sản phẩm</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên sản phẩm"
            value={newProduct.name}
            onChangeText={(text) => setNewProduct({...newProduct, name: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Mô tả</Text>
          <TextInput
            style={styles.input}
            placeholder="Mô tả sản phẩm"
            value={newProduct.desc}
            onChangeText={(text) => setNewProduct({...newProduct, desc: text})}
            placeholderTextColor={theme.colors.muted}
            multiline
          />

          <Text style={styles.inputLabel}>Giá (VND)</Text>
          <TextInput
            style={styles.input}
            placeholder="Giá tiền"
            value={newProduct.price}
            onChangeText={(text) => setNewProduct({...newProduct, price: text})}
            keyboardType="decimal-pad"
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Số lượng tồn kho</Text>
          <TextInput
            style={styles.input}
            placeholder="Số lượng"
            value={newProduct.stock}
            onChangeText={(text) => setNewProduct({...newProduct, stock: text})}
            keyboardType="number-pad"
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Danh mục</Text>
          <ScrollView style={styles.categoryList} horizontal showsHorizontalScrollIndicator={false}>
            {(categories || []).map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setNewProduct({...newProduct, categoryId: String(cat.id)})}
                style={[styles.categoryBtn, String(newProduct.categoryId) === String(cat.id) && styles.categoryBtnActive]}
              >
                <Text style={[styles.categoryBtnText, String(newProduct.categoryId) === String(cat.id) && styles.categoryBtnTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <PrimaryButton label="Tạo" onPress={handleCreateProduct} />
            <PrimaryButton label="Đóng" variant="secondary" onPress={() => {
              setShowCreateProductModal(false);
              setNewProduct({ name: '', desc: '', price: '', stock: '', categoryId: '' });
            }} />
          </View>
          </ScrollView>
        </View>
      </View>
    ) : null}

    {showEditProductModal && editingProduct ? (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chỉnh sửa sản phẩm</Text>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.inputLabel}>Tên sản phẩm</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên sản phẩm"
            value={editingProduct.name}
            onChangeText={(text) => setEditingProduct({...editingProduct, name: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Mô tả sản phẩm"
            multiline
            numberOfLines={4}
            value={editingProduct.desc}
            onChangeText={(text) => setEditingProduct({...editingProduct, desc: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Giá</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={editingProduct.price}
            onChangeText={(text) => setEditingProduct({...editingProduct, price: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Tồn kho</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={editingProduct.stock}
            onChangeText={(text) => setEditingProduct({...editingProduct, stock: text})}
            placeholderTextColor={theme.colors.muted}
          />

          <Text style={styles.inputLabel}>Danh mục</Text>
          <ScrollView style={styles.categoryScroll} horizontal>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setEditingProduct({...editingProduct, categoryId: String(cat.id)})}
                style={[styles.categoryBtn, editingProduct.categoryId === String(cat.id) && styles.categoryBtnActive]}
              >
                <Text style={[styles.categoryBtnText, editingProduct.categoryId === String(cat.id) && styles.categoryBtnTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <PrimaryButton label="Lưu" onPress={handleSaveEditProduct} />
            <PrimaryButton label="Xóa" variant="danger" onPress={() => {
              setSelectedDeleteItem({ type: 'product', id: editingProduct.id, name: editingProduct.name });
              setShowEditProductModal(false);
              setShowDeleteConfirmModal(true);
            }} />
            <PrimaryButton label="Đóng" variant="secondary" onPress={() => {
              setShowEditProductModal(false);
              setEditingProduct(null);
            }} />
          </View>
          </ScrollView>
        </View>
      </View>
    ) : null}

    {showDeleteConfirmModal && selectedDeleteItem ? (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Xác nhận xóa</Text>
          <Text style={styles.inputLabel}>
            Bạn có chắc muốn xóa {selectedDeleteItem.type === 'user' ? 'người dùng' : 'sản phẩm'}:
          </Text>
          <Text style={styles.deleteConfirmText}>{selectedDeleteItem.name}</Text>

          <View style={styles.modalActions}>
            <PrimaryButton label="Xóa" onPress={handleDeleteItem} />
            <PrimaryButton label="Hủy" variant="secondary" onPress={() => {
              setShowDeleteConfirmModal(false);
              setSelectedDeleteItem(null);
            }} />
          </View>
        </View>
      </View>
    ) : null}

    <BottomNavigation navigation={navigation} activeRoute="Admin" />
    </View>
  );
}

function MiniCard({ title, lines }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {lines.filter(Boolean).map((line) => (
        <Text key={line} style={styles.line}>{line}</Text>
      ))}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <Text style={styles.muted}>Không có dữ liệu</Text>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const chartHeight = 200;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item, index) => {
          const barHeight = (item.revenue / maxRevenue) * (chartHeight - 40);
          const date = new Date(item.date + 'T00:00:00');
          const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
          return (
            <View key={index} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(barHeight, 10) },
                ]}
              />
              <Text style={styles.barLabel}>{dayName}</Text>
              <Text style={styles.barValue}>{Number(item.revenue).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function OrderStatusChart({ data }) {
  if (!data || data.length === 0) {
    return <Text style={styles.muted}>Không có dữ liệu</Text>;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  
  const statusLabels = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Xác nhận',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Huỷ',
  };

  const statusColors = {
    PENDING: '#FFA500',
    CONFIRMED: '#4169E1',
    SHIPPED: '#9370DB',
    DELIVERED: '#32CD32',
    CANCELLED: '#DC143C',
  };

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * (chartHeight - 40);
          const color = statusColors[item.status] || theme.colors.primary;
          return (
            <View key={index} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(barHeight, 10), backgroundColor: color },
                ]}
              />
              <Text style={styles.barLabel}>{statusLabels[item.status] || item.status}</Text>
              <Text style={styles.barValue}>{item.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#000000' },
  statusBarPlaceholder: { backgroundColor: '#000000', width: '100%' },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  topIcon: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  brand: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1 },
  kicker: { color: theme.colors.muted, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.primary },
  deniedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  denied: { color: theme.colors.muted, textAlign: 'center' },
  tabs: { gap: 10, paddingVertical: 4 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginRight: 8 },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { color: theme.colors.text, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  muted: { color: theme.colors.muted },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, gap: 6 },
  cardTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 16 },
  line: { color: theme.colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { color: theme.colors.muted },
  value: { color: theme.colors.text, fontWeight: '800' },
  chartContainer: { paddingVertical: 12 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 240, gap: 8 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  barLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  barValue: { color: theme.colors.text, fontSize: 10, fontWeight: '700' },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 16 },
  paginationBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.colors.primary, borderRadius: 6 },
  paginationBtnDisabled: { backgroundColor: theme.colors.muted, opacity: 0.5 },
  paginationBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  paginationText: { color: theme.colors.text, fontWeight: '700' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 1000 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  inputLabel: { color: theme.colors.text, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, padding: 12, color: theme.colors.text, marginBottom: 12 },
  roleContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleBtn: { flex: 1, paddingVertical: 10, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, alignItems: 'center' },
  roleBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleBtnText: { color: theme.colors.text, fontWeight: '700' },
  roleBtnTextActive: { color: '#fff' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusBtn: { flex: 1, minWidth: '30%', paddingVertical: 10, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, alignItems: 'center' },
  statusBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  statusBtnText: { color: theme.colors.text, fontWeight: '700', fontSize: 12 },
  statusBtnTextActive: { color: '#fff' },
  modalActions: { gap: 8, marginTop: 16 },
  modalScroll: { maxHeight: 400, marginBottom: 16 },
  categoryList: { marginBottom: 16 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, marginRight: 8 },
  categoryBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  categoryBtnText: { color: theme.colors.text, fontWeight: '700', fontSize: 12 },
  categoryBtnTextActive: { color: '#fff' },
  deleteConfirmText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14, marginBottom: 16 },
  emailDisplay: { backgroundColor: theme.colors.background, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, color: theme.colors.muted, fontSize: 14, marginBottom: 12 },
  textarea: { height: 80, paddingVertical: 10, textAlignVertical: 'top' },
  categoryScroll: { marginBottom: 12, maxHeight: 50 },
});
