import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

export default function StatesPage() {
  const navigate = useNavigate(); 
  const [states, setStates] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // حالات ترقيم الصفحات (10 ولايات لكل صفحة كحد أقصى)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [currentState, setCurrentState] = useState({ id: null, name: '', sectorId: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [targetId, setTargetId] = useState(null);

  // تم حذف getAuthHeaders لأن ملف api.js يتولى الأمر تلقائياً

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // جلب الولايات والقطاعات بالتوازي باستخدام API.get
      const [statesRes, sectorsRes] = await Promise.all([
        API.get('/state'),
        API.get('/sector').catch(() => ({ data: [] })) // حماية في حال فشل جلب القطاعات
      ]);
      
      setStates(Array.isArray(statesRes.data) ? statesRes.data : []);
      setSectors(Array.isArray(sectorsRes.data) ? sectorsRes.data : []);
      
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول.');
      } else {
        setError(err.message || 'فشل في جلب البيانات');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveState = async (e) => {
    e.preventDefault();
    try {
      if (!currentState.sectorId) {
        alert('الرجاء اختيار القطاع الذي تتبع له الولاية.');
        return;
      }

      const payload = {
        id: currentState.id || 0,
        name: currentState.name,
        sectorId: parseInt(currentState.sectorId)
      };

      // استخدام الـ API المركزي بدلاً من fetch والـ URL المحلي
      if (isEditing) {
        await API.put(`/state/${currentState.id}`, payload);
      } else {
        await API.post('/state', payload);
      }

      setShowModal(false);
      setCurrentState({ id: null, name: '', sectorId: '' });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'فشل حفظ البيانات';
      alert(errorMsg);
    }
  };

  const handleOpenEdit = (stateItem) => {
    setCurrentState({ 
      id: stateItem.id, 
      name: stateItem.name, 
      sectorId: stateItem.sectorId || (stateItem.sector ? stateItem.sector.id : '')
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);

      // استخدام الـ API المركزي لعمليات الحذف (مفرد أو جماعي)
      if (deleteTarget === 'single') {
        await API.delete(`/state/${targetId}`);
      } else if (deleteTarget === 'all') {
        await API.delete('/state/deleteAll');
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      setTargetId(null);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'فشل عملية الحذف';
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (stateItem) => {
    setCurrentState({ 
      id: stateItem.id, 
      name: stateItem.name, 
      sectorId: stateItem.sectorId || (stateItem.sector ? stateItem.sector.id : '')
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);

      // استخدام الـ API المركزي المباشر لعمليات الحذف (مفرد أو جماعي)
      if (deleteTarget === 'single') {
        await API.delete(`/state/${targetId}`);
      } else if (deleteTarget === 'all') {
        await API.delete('/state/deleteAll');
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      setTargetId(null);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'فشل عملية الحذف';
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // فلترة الولايات بناءً على البحث
  const filteredStates = Array.isArray(states) ? states.filter((st) => {
    const nameMatch = st.name ? st.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const sectorName = st.sectorName || (st.sector ? st.sector.name : '');
    const sectorMatch = sectorName ? sectorName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch || sectorMatch;
  }) : [];

  // إعادة تعيين الصفحة الحالية إلى 1 عند البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // تقسيم الصفحات: عرض 10 عناصر فقط في الصفحة الحالية
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentStates = filteredStates.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredStates.length / rowsPerPage);

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div style={styles.titleSection}>
          <button onClick={handleBack} style={styles.backBtn}>
            ⬅ رجوع 
          </button>
          <div>
            <h2 style={styles.title}>إدارة الولايات</h2>
            <p style={styles.subtitle}>عرض وربط الولايات بالقطاعات المختلفة</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={() => {
              if (states.length === 0) {
                alert('لا توجد ولايات لحذفها.');
                return;
              }
              setDeleteTarget('all');
              setShowDeleteModal(true);
            }} 
            style={styles.deleteAllBtn}
            disabled={states.length === 0}
          >
            🗑️ حذف الكل
          </button>
          <button 
            onClick={() => {
              setCurrentState({ id: null, name: '', sectorId: '' });
              setIsEditing(false);
              setShowModal(true);
            }} 
            style={styles.addBtn}
          >
            + إضافة ولاية جديدة
          </button>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <input 
          type="text"
          placeholder="ابحث باسم الولاية أو القطاع..."
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
                <th style={styles.th}>اسم الولاية</th>
                <th style={styles.th}>القطاع التابع له</th>
                <th style={styles.th}>تاريخ الإضافة</th>
                <th style={styles.th}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentStates.length > 0 ? (
                currentStates.map((st, index) => (
                  <tr key={st.id || index} style={styles.tableRow}>
                    <td style={styles.td}>{indexOfFirstRow + index + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{st.name}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>
                        {st.sectorName || (st.sector ? st.sector.name : 'بدون قطاع')}
                      </span>
                    </td>
                    <td style={styles.td}>{st.createdAt ? new Date(st.createdAt).toLocaleDateString('ar-SA') : '-'}</td>
                    <td style={styles.td}>
                      <button onClick={() => handleOpenEdit(st)} style={styles.editBtn}>تعديل</button>
                      <button 
                        onClick={() => {
                          setDeleteTarget('single');
                          setTargetId(st.id);
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
                  <td colSpan="5" style={styles.noData}>لا توجد ولايات مطابقة للبحث</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* أزرار التنقل بين الصفحات */}
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
                الصفحة {currentPage} من {totalPages} (إجمالي الولايات: {filteredStates.length})
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

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{isEditing ? 'تعديل الولاية' : 'إضافة ولاية جديدة'}</h3>
            <form onSubmit={handleSaveState} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>اختر القطاع *</label>
                <select 
                  required
                  value={currentState.sectorId}
                  onChange={(e) => setCurrentState({ ...currentState, sectorId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">-- اختر القطاع --</option>
                  {sectors.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>اسم الولاية *</label>
                <input 
                  type="text" 
                  required 
                  value={currentState.name}
                  onChange={(e) => setCurrentState({ ...currentState, name: e.target.value })}
                  style={styles.input}
                  placeholder="أدخل اسم الولاية"
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

      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ ...styles.modalTitle, color: '#dc2626' }}>تأكيد الحذف</h3>
            <p style={{ color: '#475569', marginBottom: '20px', fontSize: '15px' }}>
              {deleteTarget === 'all' 
                ? 'هل أنت متأكد من رغبتك في حذف جميع الولايات؟' 
                : 'هل أنت متأكد من رغبتك في حذف هذه الولاية؟'}
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
  titleSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerActions: { display: 'flex', gap: '10px' },
  backBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  title: { fontSize: '26px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '15px', color: '#64748b', marginTop: '5px' },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  deleteAllBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
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
  badge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  editBtn: { backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', gap: '15px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fff' },
  pageBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  pageIndicator: { fontSize: '15px', fontWeight: '600', color: '#475569' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  saveBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmDeleteBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
};