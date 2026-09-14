import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5210/api/owner';

export default function OwnersPage() {
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // حالات نظام الترقيم (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // عدد الملاك في كل صفحة

  // نموذج الإضافة والتعديل
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentOwner, setCurrentOwner] = useState({
    id: null,
    name: '',
    phoneNumber: '',
    address: '',
    email: ''
  });

  // نافذة تأكيد الحذف
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [targetId, setTargetId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(API_URL, { headers });
      if (res.status === 401) throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول.');
      if (!res.ok) throw new Error('فشل في جلب بيانات الملاك');
      const data = await res.json();
      setOwners(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'حدث خطأ غير معروف');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // العودة للصفحة الأولى عند البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleBack = () => {
    navigate(-1);
  };

  // دالة الطباعة
  const handlePrint = () => {
    window.print();
  };

  const handleSaveOwner = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}/${currentOwner.id}` : API_URL;

      const payload = {
        ...currentOwner,
        id: currentOwner.id || 0
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
          if (errorData.errors) {
            const firstErrorKey = Object.keys(errorData.errors)[0];
            errorMsg = errorData.errors[firstErrorKey][0];
          } else {
            errorMsg = errorData.message || errorData.title || JSON.stringify(errorData);
          }
        } catch {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg);
      }

      setShowModal(false);
      setCurrentOwner({
        id: null, name: '', phoneNumber: '', address: '', email: ''
      });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (owner) => {
    setCurrentOwner({
      id: owner?.id || null,
      name: owner?.name || '',
      phoneNumber: owner?.phoneNumber || '',
      address: owner?.address || '',
      email: owner?.email || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      let response;
      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      if (deleteTarget === 'single') {
        response = await fetch(`${API_URL}/${targetId}`, { method: 'DELETE', headers });
      } else if (deleteTarget === 'all') {
        response = await fetch(`${API_URL}/deleteAll`, { method: 'DELETE', headers });
      }

      if (response?.status === 401) throw new Error('غير مصرح لك بالحذف.');

      if (!response || !response.ok) {
        let errorMsg = 'فشل عملية الحذف';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.title || JSON.stringify(errorData);
        } catch {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg);
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      setTargetId(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOwners = Array.isArray(owners) ? owners.filter((owner) => {
    if (!owner) return false;
    const nameMatch = owner.name ? owner.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const phoneMatch = owner.phoneNumber ? owner.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const emailMatch = owner.email ? owner.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch || phoneMatch || emailMatch;
  }) : [];

  // حساب العناصر الخاصة بالصفحة الحالية للترقيم
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOwners = filteredOwners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);

  // حساب الإحصائيات
  const totalOwners = owners.length;
  const totalProperties = owners.reduce((acc, owner) => {
    const props = owner?.properties || owner?.Properties || [];
    return acc + props.length;
  }, 0);
  const ownersWithProperties = owners.filter(owner => {
    const props = owner?.properties || owner?.Properties || [];
    return props.length > 0;
  }).length;

  return (
    <div style={styles.container}>
      {/* الهيدر العلوي والأزرار (مخفية تماماً عند الطباعة بفضل no-print) */}
      <div style={styles.headerRow} className="no-print">
        <div style={styles.titleSection}>
          <button onClick={handleBack} style={styles.backBtn}>
            ⬅ رجوع 
          </button>
          <div>
            <h2 style={styles.title}>إدارة الملاك</h2>
            <p style={styles.subtitle}>عرض وإدارة بيانات الملاك أو الجهات المالكة للعقارات</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={handlePrint} style={styles.printBtn}>
            🖨️ طباعة
          </button>
          <button 
            onClick={() => {
              if (!Array.isArray(owners) || owners.length === 0) {
                alert('لا توجد بيانات ملاك لحذفها.');
                return;
              }
              setDeleteTarget('all');
              setShowDeleteModal(true);
            }} 
            style={styles.deleteAllBtn}
            disabled={!Array.isArray(owners) || owners.length === 0}
          >
            🗑️ حذف الكل
          </button>
          <button 
            onClick={() => {
              setCurrentOwner({
                id: null, name: '', phoneNumber: '', address: '', email: ''
              });
              setIsEditing(false);
              setShowModal(true);
            }} 
            style={styles.addBtn}
          >
            + إضافة مالك جديد
          </button>
        </div>
      </div>

      {/* عنوان الطباعة يظهر فقط عند الطباعة */}
      <div className="print-only" style={{ display: 'none', marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#000' }}>قائمة الملاك</h1>
        <p style={{ fontSize: '14px', color: '#555' }}>تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
      </div>

      {/* كروت الإحصائيات (مخفية عند الطباعة) */}
      <div style={styles.statsContainer} className="no-print">
        <div style={styles.statCard}>
          <div style={styles.statIconBox}>👥</div>
          <div>
            <p style={styles.statLabel}>إجمالي الملاك</p>
            <h3 style={styles.statNumber}>{totalOwners}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: '#e0f2fe', color: '#0369a1' }}>🏢</div>
          <div>
            <p style={styles.statLabel}>إجمالي العقارات التابعة</p>
            <h3 style={styles.statNumber}>{totalProperties}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: '#dcfce7', color: '#15803d' }}>📋</div>
          <div>
            <p style={styles.statLabel}>ملاك لديهم عقارات</p>
            <h3 style={styles.statNumber}>{ownersWithProperties}</h3>
          </div>
        </div>
      </div>

      {/* شريط البحث (مخفي عند الطباعة) */}
      <div style={styles.searchContainer} className="no-print">
        <input 
          type="text"
          placeholder="ابحث باسم المالك، رقم الهاتف، أو البريد الإلكتروني..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {isLoading && <p style={styles.infoText}>جاري التحميل...</p>}
      {error && <p style={styles.errorText}>خطأ: {error}</p>}

      {/* جدول البيانات */}
      {!isLoading && (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>اسم المالك / الجهة المالكة</th>
                <th style={styles.th}>رقم الهاتف</th>
                <th style={styles.th}>البريد الإلكتروني</th>
                <th style={styles.th}>العنوان</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>عدد العقارات</th>
                <th style={styles.th} className="no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentOwners.length > 0 ? (
                currentOwners.map((owner, index) => {
                  const absoluteIndex = indexOfFirstItem + index + 1;
                  const propCount = (owner?.properties || owner?.Properties || []).length;
                  return (
                    <tr 
                      key={owner?.id || index} 
                      style={{ ...styles.tableRow, cursor: 'pointer' }}
                      onClick={() => navigate(`/owners/${owner.id}`)}
                    >
                      <td style={styles.td}>{absoluteIndex}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: '#0ea5e9' }}>
                        👤 {owner?.name || '-'}
                      </td>
                      <td style={styles.td}>{owner?.phoneNumber || '-'}</td>
                      <td style={styles.td}>{owner?.email || '-'}</td>
                      <td style={styles.td}>{owner?.address || '-'}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.propBadge}>{propCount}</span>
                      </td>
                      <td style={styles.td} className="no-print" onClick={(e) => e.stopPropagation()}> 
                        <button onClick={() => handleOpenEdit(owner)} style={styles.editBtn}>تعديل</button>
                        <button 
                          onClick={() => {
                            setDeleteTarget('single');
                            setTargetId(owner?.id);
                            setShowDeleteModal(true);
                          }} 
                          style={styles.deleteBtn}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={styles.noData}>لا توجد بيانات ملاك مطابقة أو الجدول فارغ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* أزرار الترقيم Pagination (مخفية عند الطباعة) */}
      {!isLoading && totalPages > 1 && (
        <div style={styles.paginationContainer} className="no-print">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.pageBtn, 
              ...(currentPage === 1 ? styles.disabledPageBtn : {})
            }}
          >
            السابق
          </button>

          <span style={styles.pageInfo}>
            صفحة {currentPage} من {totalPages}
          </span>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.pageBtn, 
              ...(currentPage === totalPages ? styles.disabledPageBtn : {})
            }}
          >
            التالي
          </button>
        </div>
      )}

      {/* Modal الإضافة والتعديل */}
      {showModal && (
        <div style={styles.modalOverlay} className="no-print">
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{isEditing ? 'تعديل بيانات المالك' : 'إضافة مالك جديد'}</h3>
            <form onSubmit={handleSaveOwner} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>اسم المالك / الجهة المالكة *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentOwner.name}
                    onChange={(e) => setCurrentOwner({ ...currentOwner, name: e.target.value })}
                    style={styles.input}
                    placeholder="أدخل اسم المالك"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>رقم الهاتف *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentOwner.phoneNumber}
                    onChange={(e) => setCurrentOwner({ ...currentOwner, phoneNumber: e.target.value })}
                    style={styles.input}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={currentOwner.email}
                    onChange={(e) => setCurrentOwner({ ...currentOwner, email: e.target.value })}
                    style={styles.input}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>
              </div>
              <div style={styles.inputGroupFull}>
                <label style={styles.label}>العنوان</label>
                <input 
                  type="text" 
                  value={currentOwner.address}
                  onChange={(e) => setCurrentOwner({ ...currentOwner, address: e.target.value })}
                  style={styles.input}
                  placeholder="أدخل العنوان بالتفصيل"
                />
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
        <div style={styles.modalOverlay} className="no-print">
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <h3 style={{ ...styles.modalTitle, color: '#dc2626' }}>تأكيد الحذف</h3>
            <p style={{ color: '#475569', marginBottom: '20px', fontSize: '15px' }}>
              {deleteTarget === 'all' 
                ? 'هل أنت متأكد من رغبتك في حذف جميع الملاك؟' 
                : 'هل أنت متأكد من رغبتك في حذف هذا المالك؟'}
            </p>
            <div style={styles.modalActions}>
              <button onClick={confirmDelete} style={styles.confirmDeleteBtn}>موافق (حذف)</button>
              <button onClick={() => setShowDeleteModal(false)} style={styles.cancelBtn}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* CSS للتحكم في الطباعة: يتم إخفاء أي عنصر يحمل الفئة no-print وإخفاء النافبار العام إن وجد */}
      <style>{`
        @media print {
          /* إخفاء الهيدر، أزرار التحكم، البحث، والترقيم تماماً */
          .no-print, nav, header, aside, footer {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background-color: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ccc !important;
            padding: 8px !important;
            color: #000 !important;
            text-align: right !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerActions: { display: 'flex', gap: '10px' },
  backBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  title: { fontSize: '26px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '15px', color: '#64748b', marginTop: '5px' },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  printBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  deleteAllBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' },
  statCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  statIconBox: { width: '50px', height: '50px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px', color: '#0f172a' },
  statLabel: { fontSize: '14px', color: '#64748b', margin: '0 0 5px 0' },
  statNumber: { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0 },

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
  propBadge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px' },
  noData: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '16px' },
  editBtn: { backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' },
  pageBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  disabledPageBtn: { backgroundColor: '#cbd5e1', cursor: 'not-allowed' },
  pageInfo: { fontSize: '15px', color: '#334155', fontWeight: '600' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' },
  modalContent: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '700px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  formRow: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  inputGroup: { flex: '1', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '5px' },
  inputGroupFull: { display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' },
  
  label: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
  
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  saveBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmDeleteBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
};