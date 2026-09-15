import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

const OWNERSHIP_TYPES = [
  'شهادة بحث',
  'افادة محلية',
  'باسم البريد والبرق',
  'بدون'
];

export default function PropertiesPage() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [cities, setCities] = useState([]);
  const [owners, setOwners] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // حالات نظام الترقيم (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // عدد العقارات في كل صفحة

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentProperty, setCurrentProperty] = useState({
    id: null,
    propertyCode: '',
    name: '',
    ownershipType: '',
    details: '',
    cityId: '',
    ownerId: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [targetId, setTargetId] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // جلب البيانات بشكل متوازي باستخدام الـ API المركزي
      const [propRes, cityRes, ownerRes] = await Promise.all([
        API.get('/property'),
        API.get('/city').catch(() => ({ data: [] })),
        API.get('/owner').catch(() => ({ data: [] }))
      ]);

      setProperties(Array.isArray(propRes.data) ? propRes.data : []);
      setCities(Array.isArray(cityRes.data) ? cityRes.data : []);
      setOwners(Array.isArray(ownerRes.data) ? ownerRes.data : []);
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول.');
      } else {
        setError(err.response?.data?.message || err.message || 'حدث خطأ غير معروف');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // إعادة الصف إلى الصفحة الأولى عند تغيير نص البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...currentProperty,
        id: currentProperty.id || 0,
        cityId: Number(currentProperty.cityId),
        ownerId: Number(currentProperty.ownerId)
      };

      if (isEditing) {
        await API.put(`/property/${currentProperty.id}`, payload);
      } else {
        await API.post('/property', payload);
      }

      setShowModal(false);
      setCurrentProperty({
        id: null, propertyCode: '', name: '', ownershipType: '', details: '', cityId: '', ownerId: ''
      });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      let errorMsg = 'فشل حفظ بيانات العقار';
      if (err.response?.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        errorMsg = err.response.data.errors[firstErrorKey][0];
      } else {
        errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || errorMsg;
      }
      alert(errorMsg);
    }
  };

  const handleOpenEdit = (prop) => {
    setCurrentProperty({
      id: prop?.id || null,
      propertyCode: prop?.propertyCode || '',
      name: prop?.name || '',
      ownershipType: prop?.ownershipType || '',
      details: prop?.details || '',
      cityId: prop?.cityId || '',
      ownerId: prop?.ownerId || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);

      if (deleteTarget === 'single') {
        await API.delete(`/property/${targetId}`);
      } else if (deleteTarget === 'all') {
        await API.delete('/property/deleteAll');
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      setTargetId(null);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'فشل عملية الحذف';
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // تصفية العقارات بناءً على البحث
  const filteredProperties = Array.isArray(properties) ? properties.filter((prop) => {
    if (!prop) return false;
    const nameMatch = prop.name ? prop.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const codeMatch = prop.propertyCode ? prop.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const typeMatch = prop.ownershipType ? prop.ownershipType.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const ownerMatch = prop.owner?.name ? prop.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    return nameMatch || codeMatch || typeMatch || ownerMatch;
  }) : [];

  // حساب العناصر الخاصة بالصفحة الحالية
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProperties = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div style={styles.titleSection}>
          <div>
            <h2 style={styles.title}>إدارة العقارات</h2>
            <p style={styles.subtitle}>عرض وإدارة العقارات والمجمعات وتتبع بيانات الملاك والمواقع</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={() => {
              if (!Array.isArray(properties) || properties.length === 0) {
                alert('لا توجد عقارات لحذفها.');
                return;
              }
              setDeleteTarget('all');
              setShowDeleteModal(true);
            }} 
            style={styles.deleteAllBtn}
            disabled={!Array.isArray(properties) || properties.length === 0}
          >
            🗑️ حذف الكل
          </button>
          <button 
            onClick={() => {
              setCurrentProperty({
                id: null, propertyCode: '', name: '', ownershipType: '', details: '', cityId: '', ownerId: ''
              });
              setIsEditing(false);
              setShowModal(true);
            }} 
            style={styles.addBtn}
          >
            + إضافة عقار جديد
          </button>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <input 
          type="text"
          placeholder="ابحث بكود العقار، اسم العقار، المالك، أو نوع الملكية..."
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
                  <th style={styles.th}>كود العقار</th>
                  <th style={styles.th}>اسم العقار / المجمع</th>
                  <th style={styles.th}>نوع الملكية</th>
                  <th style={styles.th}>المدينة</th>
                  <th style={styles.th}>المالك</th>
                  <th style={styles.th}>الوصف / التفاصيل</th>
                  <th style={styles.th}>عدد الوحدات</th>
                  <th style={styles.th}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentProperties.length > 0 ? (
                  currentProperties.map((prop, index) => {
                    const absoluteIndex = indexOfFirstItem + index + 1;
                    return (
                      <tr 
                        key={prop?.id || index} 
                        style={{ ...styles.tableRow, cursor: 'pointer' }}
                        onClick={() => {
                          navigate(`/property-units/${prop.id}`);
                        }}
                      >
                        <td style={styles.td}>{absoluteIndex}</td>
                        <td style={styles.td}>{prop?.propertyCode || '-'}</td>
                        <td style={{ ...styles.td, fontWeight: 'bold' }}>{prop?.name || '-'}</td>
                        <td style={styles.td}>{prop?.ownershipType || '-'}</td>
                        <td style={styles.td}>{prop?.city?.name || '-'}</td>
                        <td style={styles.td}>{prop?.owner?.name || '-'}</td>
                        <td style={styles.td}>{prop?.details || '-'}</td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={styles.unitBadge}>
                            {prop?.units?.length || prop?.Units?.length || 0}
                          </span>
                        </td>
                        <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleOpenEdit(prop)} style={styles.editBtn}>تعديل</button>
                          <button 
                            onClick={() => {
                              setDeleteTarget('single');
                              setTargetId(prop?.id);
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
                    <td colSpan="9" style={styles.noData}>لا توجد بيانات عقارات مطابقة أو الجدول فارغ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* أزرار الترقيم Pagination */}
          {totalPages > 1 && (
            <div style={styles.paginationContainer}>
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
        </>
      )}

      {/* Modal الإضافة والتعديل */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{isEditing ? 'تعديل بيانات العقار' : 'إضافة عقار جديد'}</h3>
            <form onSubmit={handleSaveProperty} style={styles.form}>
              
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>كود العقار *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentProperty.propertyCode}
                    onChange={(e) => setCurrentProperty({ ...currentProperty, propertyCode: e.target.value })}
                    style={styles.input}
                    placeholder="أدخل كود العقار"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>اسم العقار / المجمع *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentProperty.name}
                    onChange={(e) => setCurrentProperty({ ...currentProperty, name: e.target.value })}
                    style={styles.input}
                    placeholder="أدخل اسم العقار"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>نوع الملكية *</label>
                  <select 
                    required
                    value={currentProperty.ownershipType}
                    onChange={(e) => setCurrentProperty({ ...currentProperty, ownershipType: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">اختر نوع الملكية...</option>
                    {OWNERSHIP_TYPES.map((type, idx) => (
                      <option key={idx} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>المدينة *</label>
                  <select 
                    required
                    value={currentProperty.cityId}
                    onChange={(e) => setCurrentProperty({ ...currentProperty, cityId: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">اختر المدينة...</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>المالك *</label>
                  <select 
                    required
                    value={currentProperty.ownerId}
                    onChange={(e) => setCurrentProperty({ ...currentProperty, ownerId: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">اختر المالك...</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>تفاصيل العقار / الوصف</label>
                  <textarea 
                    value={currentProperty.details}
                    onChange={(e) => setCurrentProperty({ ...currentProperty, details: e.target.value })}
                    style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                    placeholder="اكتب وصفاً أو تفاصيل إضافية عن العقار..."
                  />
                </div>
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
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <h3 style={{ ...styles.modalTitle, color: '#dc2626' }}>تأكيد الحذف</h3>
            <p style={{ color: '#475569', marginBottom: '20px', fontSize: '15px' }}>
              {deleteTarget === 'all' 
                ? 'هل أنت متأكد من رغبتك في حذف جميع العقارات؟' 
                : 'هل أنت متأكد من رغبتك في حذف هذا العقار؟'}
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
  // تم زيادة العرض هنا من 1250px إلى 1450px ليأخذ مساحة أوسع
  container: { padding: '20px 30px', maxWidth: '1450px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerActions: { display: 'flex', gap: '10px' },
  title: { fontSize: '26px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '15px', color: '#64748b', marginTop: '5px' },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  deleteAllBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  searchContainer: { marginBottom: '20px' },
  searchInput: { width: '100%', maxWidth: '450px', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' },
  infoText: { color: '#64748b', fontSize: '16px' },
  errorText: { color: '#dc2626', fontSize: '16px', marginBottom: '15px' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '15px 20px', fontSize: '15px', fontWeight: '700', color: '#334155' },
  tableRow: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' },
  td: { padding: '15px 20px', fontSize: '15px', color: '#1e293b' },
  noData: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '16px' },
  unitBadge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' },
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
  
  label: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  saveBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmDeleteBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }
};