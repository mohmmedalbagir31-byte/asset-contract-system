import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5210/api/investor';

export default function InvestorsPage() {
  const navigate = useNavigate();
  const [investors, setInvestors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // نموذج الإضافة والتعديل
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOtherIdType, setIsOtherIdType] = useState(false);
  
  const [currentInvestor, setCurrentInvestor] = useState({
    id: null,
    name: '',
    phoneNumber: '',
    address: '',
    email: '',
    idType: 'بطاقة قومية',
    idNumber: '',
    issueDate: '',
    expiryDate: '',
    issuePlace: '',
    isActive: true
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
      if (!res.ok) throw new Error('فشل في جلب بيانات المستثمرين');
      const data = await res.json();
      setInvestors(Array.isArray(data) ? data : []);
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

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveInvestor = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}/${currentInvestor.id}` : API_URL;

      const payload = {
        ...currentInvestor,
        id: currentInvestor.id || 0,
        issueDate: currentInvestor.issueDate ? currentInvestor.issueDate : null,
        expiryDate: currentInvestor.expiryDate ? currentInvestor.expiryDate : null
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
      setIsOtherIdType(false);
      setCurrentInvestor({
        id: null, name: '', phoneNumber: '', address: '', email: '',
        idType: 'بطاقة قومية', idNumber: '', issueDate: '',
        expiryDate: '', issuePlace: '', isActive: true
      });
      setIsEditing(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (inv) => {
    const standardTypes = ['بطاقة قومية', 'رقم وطني', 'جواز سفر', 'رخصة قيادة'];
    const isCustom = inv?.idType && !standardTypes.includes(inv.idType);

    setIsOtherIdType(isCustom);
    setCurrentInvestor({
      id: inv?.id || null,
      name: inv?.name || '',
      phoneNumber: inv?.phoneNumber || '',
      address: inv?.address || '',
      email: inv?.email || '',
      idType: inv?.idType || 'بطاقة قومية',
      idNumber: inv?.idNumber || '',
      issueDate: inv?.issueDate ? inv.issueDate.split('T')[0] : '',
      expiryDate: inv?.expiryDate ? inv.expiryDate.split('T')[0] : '',
      issuePlace: inv?.issuePlace || '',
      isActive: inv?.isActive ?? true
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

  const filteredInvestors = Array.isArray(investors) ? investors.filter((inv) => {
    if (!inv) return false;
    const nameMatch = inv.name ? inv.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const phoneMatch = inv.phoneNumber ? inv.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const idMatch = inv.idNumber ? inv.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return nameMatch || phoneMatch || idMatch;
  }) : [];

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* الهيدر العلوي */}
        <div style={styles.headerRow}>
          <div style={styles.titleSection}>
            <button onClick={handleBack} style={styles.backBtn}>
              ⬅ رجوع 
            </button>
            <div>
              <h2 style={styles.title}>إدارة المستثمرين</h2>
              <p style={styles.subtitle}>عرض وإدارة بيانات المستثمرين وهوائياتهم الرسمية</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button 
              onClick={() => {
                if (!Array.isArray(investors) || investors.length === 0) {
                  alert('لا توجد بيانات مستثمرين لحذفها.');
                  return;
                }
                setDeleteTarget('all');
                setShowDeleteModal(true);
              }} 
              style={styles.deleteAllBtn}
              disabled={!Array.isArray(investors) || investors.length === 0}
            >
              🗑️ حذف الكل
            </button>
            <button 
              onClick={() => {
                setIsOtherIdType(false);
                setCurrentInvestor({
                  id: null, name: '', phoneNumber: '', address: '', email: '',
                  idType: 'بطاقة قومية', idNumber: '', issueDate: '',
                  expiryDate: '', issuePlace: '', isActive: true
                });
                setIsEditing(false);
                setShowModal(true);
              }} 
              style={styles.addBtn}
            >
              + إضافة مستثمر جديد
            </button>
          </div>
        </div>

        {/* شريط البحث */}
        <div style={styles.searchContainer}>
          <input 
            type="text"
            placeholder="ابحث باسم المستثمر، رقم الهاتف، أو رقم الهوية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {isLoading && <p style={styles.infoText}>جاري التحميل...</p>}
        {error && <p style={styles.errorText}>خطأ: {error}</p>}

        {/* عرض المستثمرين في شكل شبكة من الكروت العريضة */}
        {!isLoading && (
          <div style={styles.cardsGrid}>
            {filteredInvestors.length > 0 ? (
              filteredInvestors.map((inv) => (
                <div 
                  key={inv?.id} 
                  style={styles.investorCard}
                  onClick={() => navigate(`/investors/${inv.id}`)}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.investorName}>{inv?.name || '-'}</div>
                    <span style={{ 
                      backgroundColor: inv?.isActive ? '#dcfce7' : '#fee2e2', 
                      color: inv?.isActive ? '#166534' : '#991b1b', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '13px', 
                      fontWeight: '600' 
                    }}>
                      {inv?.isActive ? 'نشط' : 'موقف'}
                    </span>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardInfoRow}>
                      <span style={styles.cardLabel}>رقم الهاتف:</span>
                      <span style={styles.cardValue}>{inv?.phoneNumber || '-'}</span>
                    </div>
                    <div style={styles.cardInfoRow}>
                      <span style={styles.cardLabel}>نوع الهوية:</span>
                      <span style={styles.badgeState}>{inv?.idType || '-'}</span>
                    </div>
                    <div style={styles.cardInfoRow}>
                      <span style={styles.cardLabel}>رقم الهوية:</span>
                      <span style={styles.cardValue}>{inv?.idNumber || '-'}</span>
                    </div>
                    <div style={styles.cardInfoRow}>
                      <span style={styles.cardLabel}>البريد الإلكتروني:</span>
                      <span style={styles.cardValue}>{inv?.email || '-'}</span>
                    </div>
                    <div style={styles.cardInfoRow}>
                      <span style={styles.cardLabel}>العنوان:</span>
                      <span style={styles.cardValue}>{inv?.address || '-'}</span>
                    </div>
                  </div>

                  <div style={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleOpenEdit(inv)} 
                      style={styles.editBtn}
                    >
                      ✏️ تعديل
                    </button>
                    <button 
                      onClick={() => { 
                        setDeleteTarget('single'); 
                        setTargetId(inv?.id); 
                        setShowDeleteModal(true); 
                      }} 
                      style={styles.deleteBtn}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noDataCard}>
                <p style={styles.noData}>لا توجد بيانات مستثمرين مطابقة أو القائمة فارغة</p>
              </div>
            )}
          </div>
        )}

        {/* Modal الإضافة والتعديل */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>{isEditing ? 'تعديل بيانات المستثمر' : 'إضافة مستثمر جديد'}</h3>
              <form onSubmit={handleSaveInvestor} style={styles.form}>
                
                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>الاسم الكامل *</label>
                    <input 
                      type="text" 
                      required 
                      value={currentInvestor.name}
                      onChange={(e) => setCurrentInvestor({ ...currentInvestor, name: e.target.value })}
                      style={styles.input}
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>رقم الهاتف *</label>
                    <input 
                      type="text" 
                      required 
                      value={currentInvestor.phoneNumber}
                      onChange={(e) => setCurrentInvestor({ ...currentInvestor, phoneNumber: e.target.value })}
                      style={styles.input}
                      placeholder="أدخل رقم الهاتف"
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>نوع الهوية *</label>
                    <select 
                      required
                      value={isOtherIdType ? 'أخرى' : currentInvestor.idType}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'أخرى') {
                          setIsOtherIdType(true);
                          setCurrentInvestor({ ...currentInvestor, idType: '' });
                        } else {
                          setIsOtherIdType(false);
                          setCurrentInvestor({ ...currentInvestor, idType: val });
                        }
                      }}
                      style={styles.input}
                    >
                      <option value="بطاقة قومية">بطاقة قومية</option>
                      <option value="رقم وطني">رقم وطني</option>
                      <option value="جواز سفر">جواز سفر</option>
                      <option value="رخصة قيادة">رخصة قيادة</option>
                      <option value="أخرى">أخرى (اكتبه يدوياً)</option>
                    </select>

                    {isOtherIdType && (
                      <input 
                        type="text" 
                        required 
                        placeholder="اكتب نوع الهوية الجديد..." 
                        value={currentInvestor.idType}
                        onChange={(e) => setCurrentInvestor({ ...currentInvestor, idType: e.target.value })}
                        style={{ ...styles.input, marginTop: '8px' }}
                      />
                    )}
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>رقم الهوية *</label>
                    <input 
                      type="text" 
                      required 
                      value={currentInvestor.idNumber}
                      onChange={(e) => setCurrentInvestor({ ...currentInvestor, idNumber: e.target.value })}
                      style={styles.input}
                      placeholder="أدخل رقم الهوية"
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>تاريخ الإصدار</label>
                    <input 
                      type="date" 
                      value={currentInvestor.issueDate}
                      onClick={(e) => { if (typeof e.target.showPicker === 'function') e.target.showPicker(); }}
                      onChange={(e) => setCurrentInvestor({ ...currentInvestor, issueDate: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>تاريخ الانتهاء</label>
                    <input 
                      type="date" 
                      value={currentInvestor.expiryDate}
                      onClick={(e) => { if (typeof e.target.showPicker === 'function') e.target.showPicker(); }}
                      onChange={(e) => setCurrentInvestor({ ...currentInvestor, expiryDate: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>مكان الإصدار</label>
                    <input 
                      type="text" 
                      value={currentInvestor.issuePlace}
                      onChange={(e) => setCurrentInvestor({ ...currentInvestor, issuePlace: e.target.value })}
                      style={styles.input}
                      placeholder="مكان الإصدار"
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      value={currentInvestor.email}
                      onChange={(e) => setCurrentInvestor({ ...currentInvestor, email: e.target.value })}
                      style={styles.input}
                      placeholder="البريد الإلكتروني"
                    />
                  </div>
                </div>

                <div style={styles.inputGroupFull}>
                  <label style={styles.label}>العنوان</label>
                  <input 
                    type="text" 
                    value={currentInvestor.address}
                    onChange={(e) => setCurrentInvestor({ ...currentInvestor, address: e.target.value })}
                    style={styles.input}
                    placeholder="أدخل العنوان بالتفصيل"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                  <input 
                    type="checkbox" 
                    id="isActiveCheck"
                    checked={currentInvestor.isActive}
                    onChange={(e) => setCurrentInvestor({ ...currentInvestor, isActive: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActiveCheck" style={{ ...styles.label, cursor: 'pointer' }}>المستثمر نشط</label>
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
                  ? 'هل أنت متأكد من رغبتك في حذف جميع المستثمرين؟' 
                  : 'هل أنت متأكد من رغبتك في حذف هذا المستثمر؟'}
              </p>
              <div style={styles.modalActions}>
                <button onClick={confirmDelete} style={styles.confirmDeleteBtn}>موافق (حذف)</button>
                <button onClick={() => setShowDeleteModal(false)} style={styles.cancelBtn}>إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { 
    minHeight: '100vh', 
    backgroundColor: '#f8fafc', 
    paddingBottom: '40px', 
    direction: 'rtl', 
    fontFamily: 'Cairo, sans-serif' 
  },
  // إزالة maxWidth المقيّد وجعل العرض واسعًا بالكامل مع هوامش مريحة
  container: { 
    padding: '30px 45px', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerActions: { display: 'flex', gap: '10px' },
  backBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  title: { fontSize: '26px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '15px', color: '#64748b', marginTop: '5px' },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  deleteAllBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  searchContainer: { marginBottom: '25px' },
  searchInput: { width: '100%', maxWidth: '450px', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff' },
  
  // تصميم شبكة الكروت (Cards Grid) لجعلها أكبر ومنتظمة
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
    width: '100%'
  },
  investorCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.03)',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px'
  },
  investorName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#0f172a'
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '18px'
  },
  cardInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px'
  },
  cardLabel: {
    color: '#64748b',
    fontWeight: '600'
  },
  cardValue: {
    color: '#1e293b',
    fontWeight: '500'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px'
  },

  infoText: { color: '#64748b', fontSize: '16px' },
  errorText: { color: '#dc2626', fontSize: '16px', marginBottom: '15px' },
  badgeState: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  
  editBtn: { backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  
  noDataCard: { gridColumn: '1 / -1', backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' },
  noData: { color: '#64748b', fontSize: '16px', margin: 0 },

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