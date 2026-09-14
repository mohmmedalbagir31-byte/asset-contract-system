import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5210/api/user';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // حالات ترقيم الصفحات (10 صفوف لكل صفحة)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ 
    id: null, 
    username: '', 
    fullName: '', 
    email: '', 
    role: 'User', 
    isActive: true, 
    passwordHash: '' 
  });
  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetId, setTargetId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, { headers: getAuthHeaders() });
      if (response.status === 401) throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول.');
      if (!response.ok) throw new Error('فشل في جلب بيانات المستخدمين');
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'حدث خطأ غير معروف');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // إعادة الصفحة إلى رقم 1 تلقائياً عند البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}/${currentUser.id}` : API_URL;

      const payload = {
        id: currentUser.id || 0,
        username: currentUser.username,
        fullName: currentUser.fullName,
        email: currentUser.email || '',
        role: currentUser.role,
        isActive: currentUser.isActive,
        passwordHash: currentUser.passwordHash || '123456'
      };

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.status === 401) throw new Error('غير مصرح لك بالقيام بهذا الإجراء.');

      if (!response.ok) {
        let errorMsg = 'فشل حفظ البيانات';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.title || JSON.stringify(errorData);
        } catch {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg);
      }

      setShowModal(false);
      setCurrentUser({ id: null, username: '', fullName: '', email: '', role: 'User', isActive: true, passwordHash: '' });
      setIsEditing(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (userItem) => {
    setCurrentUser({ 
      id: userItem?.id || null, 
      username: userItem?.username || '', 
      fullName: userItem?.fullName || '', 
      email: userItem?.email || '', 
      role: userItem?.role || 'User', 
      isActive: userItem?.isActive ?? true, 
      passwordHash: '' 
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const response = await fetch(`${API_URL}/${targetId}`, { method: 'DELETE', headers });
      if (response.status === 401) throw new Error('غير مصرح لك بالحذف.');
      if (!response.ok) throw new Error('فشل حذف المستخدم');

      setShowDeleteModal(false);
      setTargetId(null);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter((u) => {
    if (!u) return false;
    const usernameMatch = u.username ? u.username.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const fullNameMatch = u.fullName ? u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const emailMatch = u.email ? u.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const roleMatch = u.role ? u.role.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return usernameMatch || fullNameMatch || emailMatch || roleMatch;
  }) : [];

  // حساب الصفوف الحالية للصفحة النشطة وتجهيز الترقيم
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('ar-SA');
    } catch {
      return '-';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>إدارة المستخدمين</h2>
          <p style={styles.subtitle}>إضافة وتعديل وحلاح صلاحيات مستخدمي النظام</p>
        </div>
        <button 
          onClick={() => {
            setCurrentUser({ id: null, username: '', fullName: '', email: '', role: 'User', isActive: true, passwordHash: '' });
            setIsEditing(false);
            setShowModal(true);
          }} 
          style={styles.addBtn}
        >
          + إضافة مستخدم جديد
        </button>
      </div>

      <div style={styles.searchContainer}>
        <input 
          type="text"
          placeholder="ابحث باسم المستخدم، الاسم الكامل، البريد أو الصلاحية..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {isLoading && <p style={styles.infoText}>جاري التحميل...</p>}
      {error && <p style={styles.errorText}>خطأ: {error}</p>}

      {!isLoading && (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>الاسم الكامل</th>
                <th style={styles.th}>اسم المستخدم</th>
                <th style={styles.th}>البريد الإلكتروني</th>
                <th style={styles.th}>الصلاحية</th>
                <th style={styles.th}>الحالة</th>
                <th style={styles.th}>تاريخ الإنشاء</th>
                <th style={styles.th}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((u, index) => (
                  <tr key={u?.id || index} style={styles.tableRow}>
                    <td style={styles.td}>{indexOfFirstRow + index + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{u?.fullName || '-'}</td>
                    <td style={styles.td}>{u?.username || '-'}</td>
                    <td style={styles.td}>{u?.email || '-'}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeRole}>{u?.role || 'User'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        ...styles.badgeStatus, 
                        backgroundColor: u?.isActive ? '#dcfce7' : '#fee2e2', 
                        color: u?.isActive ? '#166534' : '#991b1b' 
                      }}>
                        {u?.isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(u?.createdAt)}</td>
                    <td style={styles.td}>
                      <button onClick={() => handleOpenEdit(u)} style={styles.editBtn}>تعديل</button>
                      <button 
                        onClick={() => {
                          setTargetId(u?.id);
                          setShowDeleteModal(true);
                        }} 
                        style={styles.deleteBtn}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={styles.noData}>لا توجد مستخدمين مطابقة للبحث</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* شريط ترقيم الصفحات */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                السابق
              </button>

              <span style={styles.pageIndicator}>
                الصفحة {currentPage} من {totalPages}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal إضافة أو تعديل مستخدم */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{isEditing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
            <form onSubmit={handleSaveUser} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>الاسم الكامل *</label>
                <input 
                  type="text" 
                  required 
                  value={currentUser.fullName}
                  onChange={(e) => setCurrentUser({ ...currentUser, fullName: e.target.value })}
                  style={styles.input}
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>اسم المستخدم للتسجيل *</label>
                <input 
                  type="text" 
                  required 
                  value={currentUser.username}
                  onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                  style={styles.input}
                  placeholder="مثال: ahmed_m"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>البريد الإلكتروني</label>
                <input 
                  type="email" 
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                  style={styles.input}
                  placeholder="name@example.com"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>كلمة المرور {isEditing ? '(اتركها فارغة لعدم التغيير)' : '*'}</label>
                <input 
                  type="password" 
                  required={!isEditing}
                  value={currentUser.passwordHash}
                  onChange={(e) => setCurrentUser({ ...currentUser, passwordHash: e.target.value })}
                  style={styles.input}
                  placeholder="••••••••"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>الصلاحية *</label>
                <select 
                  value={currentUser.role}
                  onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                  style={styles.input}
                >
                  <option value="Admin">مدير النظام (Admin)</option>
                  <option value="Manager">مدير قطاع (Manager)</option>
                  <option value="User">موظف إدخال (User)</option>
                </select>
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={currentUser.isActive}
                    onChange={(e) => setCurrentUser({ ...currentUser, isActive: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>الحساب نشط</span>
                </label>
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal تأكيد الحذف */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ ...styles.modalTitle, color: '#dc2626' }}>تأكيد الحذف</h3>
            <p style={{ color: '#475569', marginBottom: '20px', fontSize: '15px' }}>
              هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟
            </p>
            <div style={styles.modalActions}>
              <button onClick={confirmDelete} style={styles.confirmDeleteBtn}>موافق (حذف)</button>
              <button onClick={() => setShowDeleteModal(false)} style={styles.cancelBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
  title: { fontSize: '26px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '15px', color: '#64748b', marginTop: '5px' },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  searchContainer: { marginBottom: '20px' },
  searchInput: { width: '100%', maxWidth: '400px', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' },
  infoText: { color: '#64748b', fontSize: '16px' },
  errorText: { color: '#dc2626', fontSize: '16px', marginBottom: '15px' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '15px 20px', fontSize: '15px', fontWeight: '700', color: '#334155' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px 20px', fontSize: '15px', color: '#1e293b' },
  noData: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '16px' },
  badgeRole: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  badgeStatus: { padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  editBtn: { backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '15px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fff' },
  pageBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
  pageIndicator: { fontSize: '15px', fontWeight: '600', color: '#475569' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  checkboxGroup: { display: 'flex', alignItems: 'center', marginTop: '5px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#334155', cursor: 'pointer' },
  label: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  saveBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmDeleteBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
};