import React, { useEffect, useRef, useState } from 'react';
import { money } from './demoData.js';
import {
  navByRole,
  firstTab,
  niceRole,
  emptyProduct,
} from './config/navigation.js';
import AuthScreen from './pages/AuthScreen.jsx';
import CashierPage from './pages/CashierPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CustomerPage from './pages/CustomerPage.jsx';
import Dialogs from './components/Dialogs.jsx';
import NoticeList from './components/NoticeList.jsx';
import {
  getCartItems,
  calculateOrderTotal,
  stockShortfall,
  validateProductDraft,
} from './domain/orderRules.js';
import { apiRequest } from './services/apiClient.js';
import { readSessionToken, saveSessionToken, clearSessionToken } from './services/sessionAuth.js';
import { buildOrderPayload, normalizeOrder } from './services/liveOrders.js';

function normalizeMenuItem(item) {
  const mapped = {
    id: Number(item.menuItemId),
    name: item.itemName,
    category: item.category,
    description: item.description ?? '',
    price: Number(item.price),
    stock: Number(item.stockQuantity),
    minimumStockLevel: Number(item.minimumStockLevel),
    isAvailable: item.isAvailable === true,
  };

  if (
    !Number.isSafeInteger(mapped.id) || mapped.id < 1 ||
    typeof mapped.name !== 'string' ||
    !Number.isFinite(mapped.price) ||
    !Number.isSafeInteger(mapped.stock) ||
    !Number.isSafeInteger(mapped.minimumStockLevel) ||
    mapped.stock < 0 || mapped.minimumStockLevel < 0 ||
    typeof item.isAvailable !== 'boolean'
  ) {
    throw new Error('The backend returned an invalid menu item.');
  }

  return mapped;
}

export default function App() {
  const [authPage, setAuthPage] = useState('login');
  // A valid JWT is restored from this browser tab's sessionStorage on reload.
  const [token, setToken] = useState(null);
  const [checkingSavedSession, setCheckingSavedSession] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('');
  const [cart, setCart] = useState({});
  const [customerText, setCustomerText] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingProduct, setEditingProduct] = useState(emptyProduct);
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
  });

  // Live Admin menu data is never written to browser demo storage.
  const [adminProducts, setAdminProducts] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);
  const [savingProduct, setSavingProduct] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('1');
  const productSaveLock = useRef(false);
  const profileSaveLock = useRef(false);
  const accountSaveLock = useRef(false);
  const orderMutationLock = useRef(false);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [accountsRefreshKey, setAccountsRefreshKey] = useState(0);
  const [savingAccount, setSavingAccount] = useState(false);
  const [liveProfile, setLiveProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [liveNotices, setLiveNotices] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeError, setNoticeError] = useState('');
  const [noticeRefreshKey, setNoticeRefreshKey] = useState(0);
  const [noticesSaving, setNoticesSaving] = useState(false);

  // All order and cashier-menu data is fetched from NestJS, never browser demo storage.
  const [orderProducts, setOrderProducts] = useState([]);
  const [orderMenuLoading, setOrderMenuLoading] = useState(false);
  const [orderMenuLoaded, setOrderMenuLoaded] = useState(false);
  const [orderMenuError, setOrderMenuError] = useState('');
  const [orderMenuRefreshKey, setOrderMenuRefreshKey] = useState(0);
  const [serverOrders, setServerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [orderActionError, setOrderActionError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);

  // Browser refresh recreates React state. Restore only after the backend
  // confirms the stored token is valid and the account remains active.
  useEffect(() => {
    const savedToken = readSessionToken();
    if (!savedToken) {
      setCheckingSavedSession(false);
      return;
    }

    let mounted = true;
    apiRequest('/auth/me', { token: savedToken })
      .then((me) => {
        if (!mounted) return;
        const uiRoles = { Admin: 'Administrator', Cashier: 'Cashier/Staff', Customer: 'Customer' };
        const role = uiRoles[me?.role];
        const id = Number(me?.userId);
        if (!role || !Number.isSafeInteger(id) || id < 1) {
          clearSessionToken();
          return;
        }
        setToken(savedToken);
        setUser({
          id,
          fullName: typeof me.fullName === 'string' ? me.fullName : me.email || 'User',
          email: typeof me.email === 'string' ? me.email : '',
          role,
        });
        setTab(firstTab[role]);
      })
      .catch((error) => {
        if (!mounted) return;
        // An expired, revoked, or disabled session must not be restored.
        // Leave the saved token alone for transient network errors so that
        // refreshing after the backend restarts can try again.
        if (error?.status === 401 || error?.status === 403) clearSessionToken();
      })
      .finally(() => {
        if (mounted) setCheckingSavedSession(false);
      });

    return () => { mounted = false; };
  }, []);


  useEffect(() => {
    if (!token || user?.role !== 'Administrator') {
      setAdminProducts([]);
      setMenuLoading(false);
      setMenuError('');
      setMenuLoaded(false);
      return;
    }

    const controller = new AbortController();

    async function loadMenu() {
      setMenuLoading(true);
      setMenuError('');

      try {
        const response = await apiRequest('/menu-items', {
          token,
          signal: controller.signal,
        });

        if (!Array.isArray(response)) {
          throw new Error('The menu API returned an unexpected response.');
        }

        const mapped = response.map(normalizeMenuItem);
        if (controller.signal.aborted) return;

        setAdminProducts(mapped);
        setMenuLoaded(true);
      } catch (error) {
        if (controller.signal.aborted) return;

        setAdminProducts([]);
        setMenuLoaded(false);
        setMenuError(
          error.status === 401
            ? 'Your session has expired. Log out and sign in again.'
            : error.message || 'Unable to load the menu.',
        );
      } finally {
        if (!controller.signal.aborted) setMenuLoading(false);
      }
    }

    void loadMenu();
    return () => controller.abort();
  }, [token, user?.role, menuRefreshKey]);

  useEffect(() => {
    if (!token || !user?.id) {
      setLiveProfile(null);
      setProfileLoading(false);
      setProfileError('');
      return;
    }
    const controller = new AbortController();
    setLiveProfile(null);
    setProfileLoading(true);
    setProfileError('');
    void apiRequest('/users/me/profile', { token, signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setLiveProfile(response);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setProfileError(error.status === 401
            ? 'Your session has expired. Sign in again.'
            : error.message || 'Unable to load your profile.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setProfileLoading(false);
      });
    return () => controller.abort();
  }, [token, user?.id]);

  useEffect(() => {
    if (!token || !user?.id) {
      setLiveNotices([]);
      setNoticeLoading(false);
      setNoticeError('');
      return;
    }
    const controller = new AbortController();
    setNoticeLoading(true);
    setNoticeError('');
    void apiRequest('/notifications', { token, signal: controller.signal })
      .then((response) => {
        if (!Array.isArray(response)) throw new Error('The notification API returned an invalid response.');
        const normalized = response.map((n) => {
          const id = Number(n.notificationId);
          if (!Number.isSafeInteger(id) || id < 1 || typeof n.message !== 'string' || typeof n.isRead !== 'boolean') {
            throw new Error('The notification API returned an invalid record.');
          }
          return {
            id,
            message: n.message,
            createdAt: n.createdAt,
            isRead: n.isRead,
            kind: n.notificationType,
          };
        });
        if (!controller.signal.aborted) setLiveNotices(normalized);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setNoticeError(error.status === 401
            ? 'Your session has expired. Sign in again.'
            : error.message || 'Unable to load notifications.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setNoticeLoading(false);
      });
    return () => controller.abort();
  }, [token, user?.id, noticeRefreshKey]);

  useEffect(() => {
    if (!token || user?.role !== 'Administrator') {
      setAdminAccounts([]);
      setAccountsLoading(false);
      setAccountsLoaded(false);
      setAccountsError('');
      return;
    }
    if (tab !== 'accounts') return;

    const controller = new AbortController();
    setAccountsLoading(true);
    setAccountsLoaded(false);
    setAccountsError('');

    void apiRequest('/admin/accounts', { token, signal: controller.signal })
      .then((response) => {
        if (!Array.isArray(response)) throw new Error('Invalid accounts response.');
        const normalized = response.map((record) => {
          const id = Number(record.userId);
          if (!Number.isSafeInteger(id) || id < 1 ||
              typeof record.fullName !== 'string' ||
              typeof record.email !== 'string' ||
              !['Admin', 'Cashier', 'Customer'].includes(record.role) ||
              typeof record.isActive !== 'boolean') {
            throw new Error('The accounts API returned an invalid record.');
          }
          return {
            id,
            fullName: record.fullName,
            email: record.email,
            role: record.role,
            isActive: record.isActive,
          };
        });
        if (!controller.signal.aborted) {
          setAdminAccounts(normalized);
          setAccountsLoaded(true);
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setAdminAccounts([]);
        setAccountsLoaded(false);
        setAccountsError(error.status === 401
          ? 'Your session has expired. Log out and sign in again.'
          : error.message || 'Unable to load accounts.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setAccountsLoading(false);
      });

    return () => controller.abort();
  }, [token, user?.role, tab, accountsRefreshKey]);

  useEffect(() => {
    if (!token || !user?.id) {
      setOrderProducts([]);
      setOrderMenuLoaded(false);
      setOrderMenuLoading(false);
      setOrderMenuError('');
      return;
    }
    const controller = new AbortController();
    setOrderMenuLoading(true);
    setOrderMenuError('');
    void apiRequest('/menu-items', { token, signal: controller.signal })
      .then((response) => {
        if (!Array.isArray(response)) throw new Error('The menu API returned an invalid response.');
        const catalog = response.map(normalizeMenuItem);
        if (!controller.signal.aborted) {
          setOrderProducts(catalog);
          setOrderMenuLoaded(true);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setOrderProducts([]);
          setOrderMenuLoaded(false);
          setOrderMenuError(error.message || 'Unable to load products.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOrderMenuLoading(false);
      });
    return () => controller.abort();
  }, [token, user?.id, orderMenuRefreshKey]);

  useEffect(() => {
    if (!token || !user?.id) {
      setServerOrders([]);
      setOrdersLoaded(false);
      setOrdersLoading(false);
      setOrdersError('');
      return;
    }
    const controller = new AbortController();
    setOrdersLoading(true);
    setOrdersError('');
    void apiRequest('/orders', { token, signal: controller.signal })
      .then((response) => {
        if (!Array.isArray(response)) throw new Error('The orders API returned an invalid response.');
        // Validate before storing. Names are resolved from the latest menu when rendering.
        response.forEach((record) => normalizeOrder(record));
        if (!controller.signal.aborted) {
          setServerOrders(response);
          setOrdersLoaded(true);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setServerOrders([]);
          setOrdersLoaded(false);
          setOrdersError(error.message || 'Unable to load orders.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOrdersLoading(false);
      });
    return () => controller.abort();
  }, [token, user?.id, ordersRefreshKey]);

  const lowProducts = orderProducts.filter(
    (p) => p.isAvailable && p.stock > 0 && p.stock <= p.minimumStockLevel,
  );
  const outProducts = orderProducts.filter((p) => !p.isAvailable || p.stock === 0);
  const cartItems = getCartItems(orderProducts, cart);
  const cartTotal = calculateOrderTotal(cartItems);
  const myNotices = liveNotices;
  // The server scopes orders by JWT role: Admin sees all, Cashier their own,
  // and Customer only orders linked to their CustomerID.
  const sortedOrders = serverOrders
    .map((record) => normalizeOrder(record, orderProducts))
    .sort((a, b) => b.id - a.id);
  const myOrders = sortedOrders;

  const adminLowProducts = adminProducts.filter(
    (p) => p.isAvailable && p.stock <= p.minimumStockLevel,
  );

  function notify(message) {
    setToast(message);
  }

  async function loginUser(email, password) {
    const login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
    });

    const accessToken = login?.access_token;
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new Error('The server did not return a valid access token.');
    }

    const me = await apiRequest('/auth/me', { token: accessToken });
    const uiRoles = {
      Admin: 'Administrator',
      Cashier: 'Cashier/Staff',
      Customer: 'Customer',
    };
    const uiRole = uiRoles[me?.role];

    if (!uiRole || !Number.isSafeInteger(Number(me?.userId))) {
      throw new Error('The authenticated account has an unsupported role or identity.');
    }

    setUser({
      id: Number(me.userId),
      fullName: login?.user?.fullName || me?.fullName || email.trim(),
      email: login?.user?.email || me?.email || email.trim(),
      role: uiRole,
    });
    saveSessionToken(accessToken);
    setToken(accessToken);
    setTab(firstTab[uiRole]);
    setAuthPage('login');
    setUserMenuOpen(false);
    setToast(
      uiRole === 'Administrator'
        ? 'Signed in. Inventory, accounts, orders, notifications, and profile use MySQL.'
        : 'Signed in. Products, orders, profile, and notifications use MySQL.',
    );
  }

  async function registerCustomer(fullName, email, password) {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: { fullName: fullName.trim(), email: email.trim(), password },
    });
  }

  function signOut() {
    clearSessionToken();
    setToken(null);
    setUser(null);
    setAdminProducts([]);
    setAdminAccounts([]);
    setAccountsLoaded(false);
    setAccountsError('');
    setAccountForm({ fullName: '', email: '', password: '' });
    setLiveProfile(null);
    setLiveNotices([]);
    setMenuLoaded(false);
    setMenuError('');
    setAuthPage('login');
    setUserMenuOpen(false);
    setCart({});
    setCustomerText('');
    setOrderProducts([]);
    setOrderMenuLoaded(false);
    setOrderMenuError('');
    setServerOrders([]);
    setOrdersLoaded(false);
    setOrdersError('');
    setOrderActionError('');
    setToast('');
  }

  function updateCart(id, nextQty) {
    if (placingOrder || !orderMenuLoaded || orderMenuError) return;
    const product = orderProducts.find((p) => p.id === id);
    if (!product) return;
    if (!product.isAvailable || product.stock <= 0) {
      notify('This product is currently unavailable.');
      return;
    }
    if (nextQty > product.stock) {
      notify(`Only ${product.stock} unit${product.stock !== 1 ? 's' : ''} available.`);
      return;
    }
    setCart((prev) => {
      const updated = { ...prev };
      if (nextQty <= 0) delete updated[id];
      else updated[id] = nextQty;
      return updated;
    });
    setOrderActionError('');
  }

  async function placeOrder() {
    if (!token || user?.role !== 'Cashier/Staff' || orderMutationLock.current ||
        !orderMenuLoaded || orderMenuLoading || orderMenuError) return;
    const missing = stockShortfall(cartItems);
    if (missing) {
      setOrderActionError(`Insufficient or unavailable stock for ${missing.name}. Refresh the menu.`);
      return;
    }

    let payload;
    try {
      payload = buildOrderPayload(cartItems, customerText);
    } catch (error) {
      setOrderActionError(error.message);
      return;
    }

    orderMutationLock.current = true;
    setPlacingOrder(true);
    setOrderActionError('');
    try {
      const created = await apiRequest('/orders', {
        token,
        method: 'POST',
        body: payload,
      });
      if (!Number.isSafeInteger(Number(created?.orderId))) {
        throw new Error('The order was sent, but the server returned an invalid confirmation. Refresh Orders before retrying.');
      }
      setCart({});
      setCustomerText('');
      setOrdersRefreshKey((key) => key + 1);
      setOrderMenuRefreshKey((key) => key + 1);
      setMenuRefreshKey((key) => key + 1);
      setTab('orders');
      notify(`Order #${created.orderNumber} placed in MySQL. ${money(Number(created.totalAmount))} total.`);
    } catch (error) {
      const message = error.status === 409
        ? `${error.message} Refresh the menu before trying again.`
        : error.status === 401
          ? 'Your session expired. Log out and sign in again.'
          : error.message || 'Unable to place order.';
      setOrderActionError(message);
      // Refresh after any uncertain network error to avoid duplicate order submissions.
      setOrdersRefreshKey((key) => key + 1);
      setOrderMenuRefreshKey((key) => key + 1);
    } finally {
      orderMutationLock.current = false;
      setPlacingOrder(false);
    }
  }

  async function changeOrderStatus(order, nextStatus) {
    if (!token || user?.role !== 'Cashier/Staff' || orderMutationLock.current ||
        order.status !== 'Pending' || !['Completed', 'Cancelled'].includes(nextStatus)) return;
    if (nextStatus === 'Cancelled' &&
        !window.confirm(`Cancel order #${order.orderNumber}? Its stock will be restored.`)) return;

    orderMutationLock.current = true;
    setStatusSavingId(order.id);
    setOrderActionError('');
    try {
      const result = await apiRequest(`/orders/${order.id}/status`, {
        token,
        method: 'PATCH',
        body: { status: nextStatus },
      });
      setOrdersRefreshKey((key) => key + 1);
      setOrderMenuRefreshKey((key) => key + 1);
      setMenuRefreshKey((key) => key + 1);
      notify(`Order #${result.orderNumber} marked ${result.orderStatus}.`);
    } catch (error) {
      setOrderActionError(error.status === 401
        ? 'Your session expired. Log out and sign in again.'
        : error.message || 'Unable to update order status.');
      setOrdersRefreshKey((key) => key + 1);
      setOrderMenuRefreshKey((key) => key + 1);
    } finally {
      orderMutationLock.current = false;
      setStatusSavingId(null);
    }
  }

  async function markRead(id) {
    if (!token || noticesSaving || !myNotices.some((n) => n.id === id && !n.isRead)) return;
    setNoticesSaving(true);
    try {
      await apiRequest(`/notifications/${id}/read`, { token, method: 'PATCH' });
      setLiveNotices((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      notify(error.status === 401 ? 'Session expired. Log out and sign in again.' : error.message || 'Unable to update notification.');
    } finally {
      setNoticesSaving(false);
    }
  }

  function openProduct(product = null) {
    if (user?.role !== 'Administrator' || !menuLoaded || menuLoading) return;
    setFormError('');
    setEditingProduct(product ? { ...product } : { ...emptyProduct });
    setModal({ type: 'product', id: product?.id ?? null });
  }

  function openRestock(product) {
    if (user?.role !== 'Administrator' || !menuLoaded || menuLoading) return;
    setFormError('');
    setRestockQuantity('1');
    setModal({ type: 'restock', id: product.id, name: product.name, stock: product.stock });
  }

  function closeDialog() {
    if (productSaveLock.current || profileSaveLock.current || accountSaveLock.current) return;
    if (modal?.type === 'account') {
      setAccountForm({ fullName: '', email: '', password: '' });
    }
    setFormError('');
    setModal(null);
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (productSaveLock.current || user?.role !== 'Administrator' || !token || modal?.type !== 'product') return;

    const validation = validateProductDraft(editingProduct, adminProducts, modal.id);
    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    const draft = validation.product;
    if (draft.name.length > 100 || draft.category.length > 50 || draft.description.length > 255 || draft.price >= 100000000) {
      setFormError('Check the text lengths and price (maximum 99,999,999.99).');
      return;
    }

    const isEdit = modal.id != null;
    // Stock is intentionally NOT included when editing: use the separate Restock operation.
    const payload = {
      itemName: draft.name,
      category: draft.category,
      description: draft.description,
      price: Number(draft.price).toFixed(2),
      minimumStockLevel: draft.minimumStockLevel,
      isAvailable: draft.isAvailable,
      ...(!isEdit ? { stockQuantity: draft.stock } : {}),
    };

    productSaveLock.current = true;
    setSavingProduct(true);
    setFormError('');
    try {
      await apiRequest(isEdit ? `/menu-items/${modal.id}` : '/menu-items', {
        token,
        method: isEdit ? 'PATCH' : 'POST',
        body: payload,
      });
      setModal(null);
      setMenuRefreshKey((key) => key + 1);
      notify(isEdit ? 'Menu item updated in MySQL.' : 'New menu item saved in MySQL.');
    } catch (error) {
      setFormError(error.status === 401
        ? 'Your session expired. Log out and sign in again.'
        : error.message || 'The menu item could not be saved.');
    } finally {
      productSaveLock.current = false;
      setSavingProduct(false);
    }
  }

  async function saveRestock(event) {
    event.preventDefault();
    if (productSaveLock.current || user?.role !== 'Administrator' || !token || modal?.type !== 'restock') return;

    const quantityText = String(restockQuantity).trim();
    const quantity = Number(quantityText);
    if (!/^\d+$/.test(quantityText) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647) {
      setFormError('Enter a positive whole-number quantity.');
      return;
    }

    productSaveLock.current = true;
    setSavingProduct(true);
    setFormError('');
    try {
      const result = await apiRequest(`/menu-items/${modal.id}/restock`, {
        token,
        method: 'PATCH',
        body: { quantity },
      });
      setModal(null);
      setMenuRefreshKey((key) => key + 1);
      notify(`${result.itemName || 'Product'}: added ${quantity} unit(s). New stock: ${result.stockQuantity}.`);
    } catch (error) {
      setFormError(error.status === 401
        ? 'Your session expired. Log out and sign in again.'
        : error.message || 'Restocking failed.');
    } finally {
      productSaveLock.current = false;
      setSavingProduct(false);
    }
  }

  async function addAccount(event) {
    event.preventDefault();
    if (!token || user?.role !== 'Administrator' || accountSaveLock.current) return;
    const fullName = accountForm.fullName.trim();
    const email = accountForm.email.trim().toLowerCase();
    const password = accountForm.password;
    if (fullName.length < 2 || fullName.length > 100 || !/^\S+@\S+\.\S+$/.test(email)) {
      setFormError('Enter a name (2–100 characters) and a valid email.');
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setFormError('Initial password must have 12–128 characters.');
      return;
    }

    accountSaveLock.current = true;
    setSavingAccount(true);
    setFormError('');
    try {
      await apiRequest('/admin/accounts/staff', {
        token,
        method: 'POST',
        body: { fullName, email, password },
      });
      setAccountForm({ fullName: '', email: '', password: '' });
      setModal(null);
      setAccountsRefreshKey((key) => key + 1);
      notify('Cashier account created in MySQL. Share its initial password securely.');
    } catch (error) {
      setFormError(error.status === 401
        ? 'Your session has expired. Log out and sign in again.'
        : error.message || 'Unable to create staff account.');
    } finally {
      accountSaveLock.current = false;
      setSavingAccount(false);
    }
  }

  async function changeAccountStatus(account) {
    if (!token || user?.role !== 'Administrator' || accountSaveLock.current ||
        account.role === 'Admin' || account.id === user.id) return;
    const nextActive = !account.isActive;
    const action = nextActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${account.fullName}?`)) return;

    accountSaveLock.current = true;
    setSavingAccount(true);
    try {
      await apiRequest(`/admin/accounts/${account.id}/status`, {
        token,
        method: 'PATCH',
        body: { isActive: nextActive },
      });
      setAccountsRefreshKey((key) => key + 1);
      notify(`${account.fullName} ${nextActive ? 'activated' : 'deactivated'} in MySQL.`);
    } catch (error) {
      notify(error.status === 401
        ? 'Your session has expired. Log out and sign in again.'
        : error.message || 'Unable to update account status.');
    } finally {
      accountSaveLock.current = false;
      setSavingAccount(false);
    }
  }

  async function openProfile() {
    if (!token || profileSaveLock.current) return;
    setUserMenuOpen(false);
    setFormError('');
    try {
      const result = await apiRequest('/users/me/profile', { token });
      setLiveProfile(result);
      setProfileForm({
        fullName: result.fullName || user.fullName,
        phoneNumber: result.phoneNumber || '',
        address: result.address || '',
      });
      setProfileError('');
      setModal({ type: 'profile' });
    } catch (error) {
      notify(error.status === 401 ? 'Your session expired. Log out and sign in again.' : error.message || 'Could not open the live profile.');
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!token || profileSaveLock.current) return;
    const fullName = profileForm.fullName.trim();
    if (!fullName || fullName.length > 100 || profileForm.phoneNumber.length > 20 || profileForm.address.length > 255) {
      setFormError('Enter a name (1–100 characters), phone (up to 20), and address (up to 255).');
      return;
    }
    profileSaveLock.current = true;
    setSavingProfile(true);
    setFormError('');
    try {
      const updated = await apiRequest('/users/me/profile', {
        token,
        method: 'PATCH',
        body: {
          fullName,
          phoneNumber: profileForm.phoneNumber.trim() || null,
          address: profileForm.address.trim() || null,
        },
      });
      setLiveProfile(updated);
      setProfileError('');
      setUser((prev) => prev ? { ...prev, fullName: updated.fullName } : prev);
      setModal(null);
      notify('Profile changes saved to MySQL.');
    } catch (error) {
      setFormError(error.status === 401 ? 'Your session expired. Log out and sign in again.' : error.message || 'Profile could not be saved.');
    } finally {
      profileSaveLock.current = false;
      setSavingProfile(false);
    }
  }

  function openAccountDialog() {
    setAccountForm({ fullName: '', email: '', password: '' });
    setFormError('');
    setModal({ type: 'account' });
  }

  async function markAllRead() {
    if (!token || noticesSaving) return;
    setNoticesSaving(true);
    try {
      await apiRequest('/notifications/read-all', { token, method: 'PATCH' });
      setLiveNotices((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      notify(error.status === 401 ? 'Your session expired. Log out and sign in again.' : error.message || 'Unable to mark notifications as read.');
    } finally {
      setNoticesSaving(false);
    }
  }

  if (checkingSavedSession) {
    return (
      <div className="auth-layout">
        <main className="auth-main">
          <div className="auth-content" role="status">
            <h1>Checking session...</h1>
            <p className="auth-subtitle">Verifying your login with the FoBeGoodFlow backend.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        page={authPage}
        setPage={setAuthPage}
        onLogin={loginUser}
        onRegister={registerCustomer}
      />
    );
  }

  const isAdmin = user.role === 'Administrator';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <strong>FoBeGoodFlow</strong>
          <span>{niceRole[user.role] || user.role}</span>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          {navByRole[user.role].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${tab === item.id ? 'active' : ''}`}
              onClick={() => {
                if (['orders', 'my-orders'].includes(item.id)) setOrdersRefreshKey((key) => key + 1);
                if (item.id === 'new-order') setOrderMenuRefreshKey((key) => key + 1);
                setTab(item.id);
                setUserMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-user">
          <button
            className="user-trigger"
            type="button"
            aria-expanded={userMenuOpen}
            aria-label="Account menu"
            onClick={() => setUserMenuOpen((open) => !open)}
          >
            {user.fullName} <span className="chevron">⌄</span>
          </button>
          {userMenuOpen && (
            <div className="user-popover">
              <small>Authenticated session</small>
              <button type="button" onClick={openProfile}>Edit my profile</button>
              <button type="button" onClick={signOut}>Log out</button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <div className="inline-alert" role="status" style={{ marginBottom: 16 }}>
          {isAdmin
            ? 'Inventory, accounts, orders, notifications, and profile are connected through NestJS to MySQL.'
            : 'Authentication, products, orders, profile, and notifications are connected through NestJS to MySQL.'}
        </div>

        {user.role === 'Cashier/Staff' ? (
          <CashierPage
            tab={tab}
            products={orderProducts}
            cart={cart}
            cartItems={cartItems}
            cartTotal={cartTotal}
            customerText={customerText}
            onCustomerText={setCustomerText}
            onUpdateCart={updateCart}
            onPlaceOrder={placeOrder}
            placingOrder={placingOrder}
            orderMenuLoading={orderMenuLoading}
            orderMenuLoaded={orderMenuLoaded}
            orderMenuError={orderMenuError}
            onReloadOrderMenu={() => setOrderMenuRefreshKey((key) => key + 1)}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            ordersLoaded={ordersLoaded}
            orderActionError={orderActionError}
            statusSavingId={statusSavingId}
            onRefreshOrders={() => setOrdersRefreshKey((key) => key + 1)}
            sortedOrders={sortedOrders}
            lowProducts={lowProducts}
            outProducts={outProducts}
            onTabChange={setTab}
            onChangeOrderStatus={changeOrderStatus}
            liveNotices={myNotices}
            noticeLoading={noticeLoading}
            noticeError={noticeError}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onRefreshNotices={() => setNoticeRefreshKey((key) => key + 1)}
            noticesSaving={noticesSaving}
          />
        ) : isAdmin && tab === 'notifications' ? (
          <div className="content-area narrow-content">
            <div className="page-heading">
              <div><h1>Notifications</h1><p>Notifications for your signed-in account, from MySQL.</p></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button type="button" className="secondary-button" onClick={() => setNoticeRefreshKey((n) => n + 1)} disabled={noticeLoading}>
                  {noticeLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                {myNotices.some((n) => !n.isRead) && <button type="button" className="underlined" onClick={markAllRead} disabled={noticesSaving}>Mark all read</button>}
              </div>
            </div>
            {noticeError && <div className="inline-alert" role="alert">{noticeError}</div>}
            {noticeLoading && <p role="status">Loading notifications...</p>}
            {!noticeLoading && !noticeError && <div className="notices-panel"><NoticeList notices={myNotices} onRead={markRead} /></div>}
          </div>
        ) : isAdmin ? (
          <AdminPage
            tab={tab}
            products={adminProducts}
            lowProducts={adminLowProducts}
            menuLoading={menuLoading}
            menuLoaded={menuLoaded}
            menuError={menuError}
            onReloadProducts={() => setMenuRefreshKey((key) => key + 1)}
            onOpenProduct={openProduct}
            onOpenRestock={openRestock}
            savingProduct={savingProduct}
            accounts={adminAccounts}
            accountsLoading={accountsLoading}
            accountsLoaded={accountsLoaded}
            accountsError={accountsError}
            savingAccount={savingAccount}
            onReloadAccounts={() => setAccountsRefreshKey((key) => key + 1)}
            onChangeAccountStatus={changeAccountStatus}
            sortedOrders={sortedOrders}
            ordersLoading={ordersLoading}
            ordersLoaded={ordersLoaded}
            ordersError={ordersError}
            onRefreshOrders={() => setOrdersRefreshKey((key) => key + 1)}
            onAddAccount={openAccountDialog}
          />
        ) : (
          <CustomerPage
            tab={tab}
            myOrders={myOrders}
            ordersLoading={ordersLoading}
            ordersLoaded={ordersLoaded}
            ordersError={ordersError}
            onRefreshOrders={() => setOrdersRefreshKey((key) => key + 1)}
            myNotices={myNotices}
            profile={liveProfile}
            profileLoading={profileLoading}
            profileError={profileError}
            noticeLoading={noticeLoading}
            noticeError={noticeError}
            noticesSaving={noticesSaving}
            onRefreshNotices={() => setNoticeRefreshKey((key) => key + 1)}
            user={user}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onTabChange={setTab}
            onOpenProfile={openProfile}
          />
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button aria-label="Dismiss notification" type="button" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}

      <Dialogs
        modal={modal}
        onClose={closeDialog}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        onSaveProduct={saveProduct}
        onRestockProduct={saveRestock}
        restockQuantity={restockQuantity}
        setRestockQuantity={setRestockQuantity}
        savingProduct={savingProduct}
        formError={formError}
        accountForm={accountForm}
        setAccountForm={setAccountForm}
        onAddAccount={addAccount}
        savingAccount={savingAccount}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        onSaveProfile={saveProfile}
        savingProfile={savingProfile}
      />
    </div>
  );
}
