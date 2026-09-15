import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

export default function CitiesPage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // حالات التنقل بين الصفحات (Pagination States)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [currentCity, setCurrentCity] = useState({ id: null, name: '', stateId: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [targetId, setTargetId] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // جلب المدن والولايات بالتوازي باستخدام ملف الـ API المركزي
      const [citiesRes, statesRes] = await Promise.all([
        API.get('/city'),
        API.get('/state').catch(() => ({ data: [] })) // حماية في حال فشل جلب الولايات
      ]);

      setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);
      setStates(Array.isArray(statesRes.data) ? statesRes.data : []);

      setError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول.');
      } else {
        setError(err.message || 'فشل في جلب بيانات المدن');
      }
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

  const handleSaveCity = async (e) => {
    e.preventDefault();
    try {
      if (!currentCity.stateId) {
        alert('الرجاء اختيار ولاية التابعة لها المدينة.');
        return;
      }

      const payload = {
        id: currentCity.id || 0,
        name: currentCity.name,
        stateId: parseInt(currentCity.stateId, 10)
      };

      // استخدام الـ API المركزي بدلاً من fetch والـ URL المحلي
      if (isEditing) {
        await API.put(`/city/${currentCity.id}`, payload);
      } else {
        await API.post('/city', payload);
      }

      setShowModal(false);
      setCurrentCity({ id: null, name: '', stateId: '' });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'فشل حفظ البيانات';
      alert(errorMsg);
    }
  };

  const handleOpenEdit = (cityItem) => {
    setCurrentCity({ 
      id: cityItem?.id || null, 
      name: cityItem?.name || '', 
      stateId: cityItem?.stateId || (cityItem?.state?.id ? cityItem.state.id : '')
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);

      // استخدام الـ API المركزي المباشر لعمليات الحذف (مفرد أو جماعي)
      if (deleteTarget === 'single') {
        await API.delete(`/city/${targetId}`);
      } else if (deleteTarget === 'all') {
        await API.delete('/city/deleteAll');
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

  // تصفية المدن بناءً على البحث
  const filteredCities = Array.isArray(cities) ? cities.filter((c) => {
    if (!c) return false;
    const nameMatch = c.name ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const stateName = c.stateName || (c.state ? c.state.name : '');
    const stateMatch = stateName ? stateName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const sectorName = c.sectorName || '';
    const sectorMatch = sectorName ? sectorName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch || stateMatch || sectorMatch;
  }) : [];

  // حساب العناصر الخاصة بالصفحة الحالية فقط (10 عناصر)
  const totalPages = Math.ceil(filteredCities.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCities = filteredCities.slice(indexOfFirstItem, indexOfLastItem);

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
        <div style={styles.titleSection}>
          <button onClick={handleBack} style={styles.backBtn}>
            ⬅ رجوع 
          </button>
          <div>
            <h2 style={styles.title}>إدارة المدن</h2>
            <p style={styles.subtitle}>عرض وربط المدن بالولايات والقطاعات المختلفة</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={() => {
              if (!Array.isArray(cities) || cities.length === 0) {
                alert('لا توجد مدن لحذفها.');
                return;
              }
              setDeleteTarget('all');
              setShowDeleteModal(true);
            }} 
            style={styles.deleteAllBtn}
            disabled={!Array.isArray(cities) || cities.length === 0}
          >
            🗑️ حذف الكل
          </button>
          <button 
            onClick={() => {
              setCurrentCity({ id: null, name: '', stateId: '' });
              setIsEditing(false);
              setShowModal(true);
            }} 
            style={styles.addBtn}
          >
            + إضافة مدينة جديدة
          </button>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <input 
          type="text"
          placeholder="ابحث باسم المدينة أو ولاية أو القطاع..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {isLoading && <p style={styles.infoText}>جاري التحميل...</p>}
      {error && <p style={styles.errorText}>خطأ: {error}</p>}

      {!isLoading && (
        <>
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>اسم المدينة</th>
                  <th style={styles.th}>الولاية التابعة لها</th>
                  <th style={styles.th}>القطاع</th>
                  <th style={styles.th}>تاريخ الإضافة</th>
                  <th style={styles.th}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentCities.length > 0 ? (
                  currentCities.map((c, index) => (
                    <tr key={c?.id || index} style={styles.tableRow}>
                      <td style={styles.td}>{indexOfFirstItem + index + 1}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{c?.name || '-'}</td>
                      <td style={styles.td}>
                        <span style={styles.badgeState}>
                          {c?.stateName || (c?.state?.name ? c.state.name : 'بدون ولاية')}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badgeSector}>
                          {c?.sectorName || 'بدون قطاع'}
                        </span>
                      </td>
                      <td style={styles.td}>{formatDate(c?.createdAt)}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleOpenEdit(c)} style={styles.editBtn}>تعديل</button>
                        <button 
                          onClick={() => {
                            setDeleteTarget('single');
                            setTargetId(c?.id);
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
                    <td colSpan="6" style={styles.noData}>لا توجد مدن مطابقة أو الجدول فارغ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* شريط التنقل بين الصفحات (Pagination Controls) */}
          {filteredCities.length > 0 && (
            <div style={styles.paginationContainer}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                السابق
              </button>

              <span style={styles.pageInfo}>
                الصفحة {currentPage} من {totalPages} (إجمالي: {filteredCities.length} مدينة)
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal الإضافة والتعديل */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{isEditing ? 'تعديل المدينة' : 'إضافة مدينة جديدة'}</h3>
            <form onSubmit={handleSaveCity} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>اختر الولاية *</label>
                <select 
                  required
                  value={currentCity.stateId}
                  onChange={(e) => setCurrentCity({ ...currentCity, stateId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">-- اختر الولاية --</option>
                  {Array.isArray(states) && states.map((st) => (
                    <option key={st?.id} value={st?.id}>
                      {st?.name || ''} {st?.sectorName ? `(${st.sectorName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>اسم المدينة *</label>
                <input 
                  type="text" 
                  required 
                  value={currentCity.name}
                  onChange={(e) => setCurrentCity({ ...currentCity, name: e.target.value })}
                  style={styles.input}
                  placeholder="أدخل اسم المدينة"
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
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ ...styles.modalTitle, color: '#dc2626' }}>تأكيد الحذف</h3>
            <p style={{ color: '#475569', marginBottom: '20px', fontSize: '15px' }}>
              {deleteTarget === 'all' 
                ? 'هل أنت متأكد من رغبتك في حذف جميع المدن؟' 
                : 'هل أنت متأكد من رغبتك في حذف هذه المدينة؟'}
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
  badgeState: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  badgeSector: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  editBtn: { backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '8px' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  
  // أنماط شريط التنقل بين الصفحات
  paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 5px' },
  pageBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' },
  pageInfo: { fontSize: '14px', color: '#475569', fontWeight: '600' },

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