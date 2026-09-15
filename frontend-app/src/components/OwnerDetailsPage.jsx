import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

export default function OwnerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [owner, setOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // حالات نافذة (Modal) إضافة عقار جديد
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cities, setCities] = useState([]);
  
  const [newProp, setNewProp] = useState({
    propertyCode: '',
    name: '',
    ownershipType: '',
    customOwnershipType: '',
    cityId: '',
    details: ''
  });
  
  // وحدات العقار
  const [unitsList, setUnitsList] = useState([
    { unitNumber: '', activityType: '', customActivityType: '', areaSize: '', status: 'متاحة', description: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالات الترقيم (Pagination) لجدول العقارات
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchOwnerDetails = async () => {
    setIsLoading(true);
    try {
      const res = await API.get(`/owner/${id}`);
      setOwner(res.data);
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('انتهت صلاحية الجلسة.');
      } else {
        setError(err.response?.data?.message || err.message || 'حدث خطأ في جلب التفاصيل');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await API.get('/city');
      setCities(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log('خطأ في جلب المدن');
    }
  };

  useEffect(() => {
    fetchOwnerDetails();
    fetchCities();
  }, [id]);

  const handleUnitChange = (index, field, value) => {
    const updated = [...unitsList];
    updated[index][field] = value;
    setUnitsList(updated);
  };

  const addUnitRow = () => {
    setUnitsList([...unitsList, { unitNumber: '', activityType: '', customActivityType: '', areaSize: '', status: 'متاحة', description: '' }]);
  };

  const removeUnitRow = (index) => {
    setUnitsList(unitsList.filter((_, i) => i !== index));
  };

  const handleSaveProperty = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalOwnershipType = newProp.ownershipType === 'أخرى' 
        ? newProp.customOwnershipType 
        : newProp.ownershipType;

      const payload = {
        propertyCode: newProp.propertyCode,
        name: newProp.name,
        ownershipType: finalOwnershipType,
        details: newProp.details,
        cityId: parseInt(newProp.cityId, 10),
        ownerId: parseInt(id, 10),
        units: unitsList
          .filter(u => u.unitNumber.trim() !== '')
          .map(u => ({
            unitNumber: u.unitNumber,
            activityType: u.activityType === 'أخرى' ? u.customActivityType : u.activityType,
            areaSize: u.areaSize ? parseFloat(u.areaSize) : 0,
            status: u.status,
            description: u.description
          }))
      };

      const res = await API.post('/property', payload);

      setIsModalOpen(false);
      setNewProp({ propertyCode: '', name: '', ownershipType: '', customOwnershipType: '', cityId: '', details: '' });
      setUnitsList([{ unitNumber: '', activityType: '', customActivityType: '', areaSize: '', status: 'متاحة', description: '' }]);
      fetchOwnerDetails();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'حدث خطأ أثناء الحفظ';
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={styles.container}><p style={styles.infoText}>جاري تحميل تفاصيل المالك...</p></div>;
  }

  if (error || !owner) {
    return (
      <div style={styles.container}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>⬅ رجوع</button>
        <p style={styles.errorText}>{error || 'لم يتم العثور على المالك المطلوب'}</p>
      </div>
    );
  }

  const propertiesList = owner.properties || owner.Properties || [];
  const totalProperties = propertiesList.length;
  const totalUnits = propertiesList.reduce((acc, prop) => {
    const count = prop.unitsCount ?? (prop.units || prop.Units || []).length;
    return acc + count;
  }, 0);

  // حساب الترقيم (Pagination)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProperties = propertiesList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(propertiesList.length / itemsPerPage);

  return (
    <div style={styles.pageWrapper}>
      {/* تنسيقات الطباعة */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: #fff !important; }
          .print-container { width: 100% !important; margin: 0 !important; padding: 10px !important; }
          
          .print-header-brand { 
            display: block !important; 
            font-size: 22px; 
            font-weight: bold; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 8px; 
            color: #000; 
            text-align: center;
          }

          .print-owner-full { 
            display: block !important; 
            width: 100% !important; 
            margin-bottom: 25px !important; 
            border: 1px solid #cbd5e1 !important; 
            padding: 20px !important; 
            border-radius: 8px !important; 
            background: #f8fafc !important; 
          }

          .print-owner-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px !important;
            margin-top: 15px !important;
          }

          .print-table-section { width: 100% !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 10px !important; color: #000 !important; }
          th { background-color: #f1f5f9 !important; }
        }
        .print-header-brand { display: none; }
        .print-owner-full { display: none; }
      `}</style>

      {/* شريط التنقل العلوي (بدون زر الطباعة) */}
      <div style={styles.navbar} className="no-print">
        <div style={styles.navBrand}>🏢 نظام إدارة العقود والأصول</div>
        <div style={styles.navLinks}>
          <button onClick={() => navigate('/owners')} style={styles.navLinkBtn}>إدارة الملاك</button>
          <button onClick={() => navigate('/')} style={styles.navLinkBtn}>الرئيسية</button>
        </div>
      </div>

      <div style={styles.container} className="print-container">
        
        {/* 1. عنوان الموقع يظهر في أول الورقة عند الطباعة */}
        <div className="print-header-brand">
          🏢 نظام إدارة العقود والأصول - ملف المالك والتقرير الشامل
        </div>

        {/* 2. بيانات المالك بالعرض الكامل عند الطباعة */}
        <div className="print-owner-full">
          <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
            بيانات المالك: {owner.name}
          </h3>
          <div className="print-owner-grid">
            <div>
              <strong>رقم الهاتف:</strong> <p style={{ margin: '4px 0 0 0' }}>{owner.phoneNumber || 'غير مدخل'}</p>
            </div>
            <div>
              <strong>البريد الإلكتروني:</strong> <p style={{ margin: '4px 0 0 0' }}>{owner.email || 'غير مدخل'}</p>
            </div>
            <div>
              <strong>العنوان:</strong> <p style={{ margin: '4px 0 0 0' }}>{owner.address || 'غير مدخل'}</p>
            </div>
          </div>
        </div>

        <div style={styles.headerRow} className="no-print">
          <div style={styles.titleSection}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>⬅ رجوع </button>
            <div>
              <h2 style={styles.title}>ملف المالك: {owner.name}</h2>
              <p style={styles.subtitle}>عرض كافّة عقارات وإحصائيات وبيانات المالك</p>
            </div>
          </div>
          
          {/* الأزرار في نفس الصف: زر إضافة عقار وجانبه مباشرة زر ملف الطباعة */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsModalOpen(true)} style={styles.addPropertyBtn}>
              + إضافة عقار جديد ووحداته
            </button>
            <button onClick={() => window.print()} style={styles.printActionBtn}>
              🖨 ملف الطباعه
            </button>
          </div>
        </div>

        <div style={styles.mainLayout}>
          {/* القسم الأيمن: الإحصائيات وجدول العقارات */}
          <div style={styles.rightSection} className="print-table-section">
            <div style={styles.statsContainer} className="no-print">
              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, backgroundColor: '#e0f2fe', color: '#0369a1' }}>🏢</div>
                <div>
                  <p style={styles.statLabel}>العقارات المملوكة</p>
                  <h3 style={styles.statNumber}>{totalProperties}</h3>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={{ ...styles.statIconBox, backgroundColor: '#fef3c7', color: '#b45309' }}>🔑</div>
                <div>
                  <p style={styles.statLabel}>إجمالي الوحدات التابعة</p>
                  <h3 style={styles.statNumber}>{totalUnits}</h3>
                </div>
              </div>
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableHeaderSection}>
                <h3 style={styles.sectionTitle}>قائمة العقارات التابعة للمالك</h3>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>كود العقار</th>
                    <th style={styles.th}>اسم العقار / المجمع</th>
                    <th style={styles.th}>نوع الملكية</th>
                    <th style={styles.th}>المدينة</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>عدد الوحدات</th>
                  </tr>
                </thead>
                <tbody>
                  {propertiesList.length > 0 ? (
                    (window.matchMedia && window.matchMedia('print').matches ? propertiesList : currentProperties).map((prop, index) => {
                      const unitCount = prop.unitsCount ?? (prop.units || prop.Units || []).length;
                      const absoluteIndex = indexOfFirstItem + index + 1;
                      return (
                        <tr key={prop.id || index} style={styles.tableRow}>
                          <td style={styles.td}>{absoluteIndex}</td>
                          <td style={styles.td}>
                            <span 
                              style={{ fontWeight: 'bold', color: '#0284c7', cursor: 'pointer' }}
                              onClick={() => navigate(`/property-units/${prop.id}`)}
                            >
                              {prop.propertyCode || '-'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: '500' }}>{prop.name || '-'}</td>
                          <td style={styles.td}>{prop.ownershipType || '-'}</td>
                          <td style={styles.td}>{prop.cityName || prop.city?.name || '-'}</td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={styles.unitBadge}>{unitCount}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={styles.noData}>لا توجد عقارات مسجلة باسم هذا المالك حتى الآن</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {propertiesList.length > 0 && (
                <div style={styles.paginationContainer} className="no-print">
                  <div style={styles.paginationInfo}>
                    عرض {indexOfFirstItem + 1} إلى {Math.min(indexOfLastItem, propertiesList.length)} من أصل {propertiesList.length} عقار
                  </div>
                  <div style={styles.paginationControls}>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      السابق
                    </button>
                    <span style={styles.pageIndicator}>صفحة {currentPage} من {totalPages || 1}</span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      style={{ ...styles.pageBtn, opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1 }}
                    >
                      التالي
                    </button>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      style={styles.rowsSelect}
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* القسم الأيسر: كرت معلومات المالك للشاشة */}
          <div style={styles.leftSection} className="no-print">
            <div style={styles.profileCard}>
              <div style={styles.avatarBox}>
                <span style={{ fontSize: '40px' }}>👤</span>
              </div>
              <h3 style={styles.profileName}>{owner.name}</h3>
              <p style={styles.profileRole}>مالك عقارات</p>
              <hr style={styles.divider} />
              <div style={styles.infoGroup}>
                <label style={styles.infoLabel}>📱 رقم الهاتف:</label>
                <p style={styles.infoValue}>{owner.phoneNumber || 'غير مدخل'}</p>
              </div>
              <div style={styles.infoGroup}>
                <label style={styles.infoLabel}>📧 البريد الإلكتروني:</label>
                <p style={styles.infoValue}>{owner.email || 'غير مدخل'}</p>
              </div>
              <div style={styles.infoGroup}>
                <label style={styles.infoLabel}>📍 العنوان:</label>
                <p style={styles.infoValue}>{owner.address || 'غير مدخل'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* نافذة (Modal) إضافة عقار جديد ووحداته */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>إضافة عقار جديد ووحداته للمالك: {owner.name}</h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>✖</button>
            </div>

            <form onSubmit={handleSaveProperty} style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.infoLabel}>كود العقار:</label>
                <input 
                  type="text" 
                  required
                  style={styles.inputField} 
                  value={newProp.propertyCode}
                  onChange={(e) => setNewProp({...newProp, propertyCode: e.target.value})}
                  placeholder="أدخل كود العقار"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.infoLabel}>اسم العقار / المجمع:</label>
                <input 
                  type="text" 
                  required
                  style={styles.inputField} 
                  value={newProp.name}
                  onChange={(e) => setNewProp({...newProp, name: e.target.value})}
                  placeholder="أدخل اسم العقار"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.infoLabel}>نوع الملكية:</label>
                <select 
                  required
                  style={styles.inputField}
                  value={newProp.ownershipType}
                  onChange={(e) => setNewProp({...newProp, ownershipType: e.target.value})}
                >
                  <option value="">اختر نوع الملكية</option>
                  <option value="شهادة بحث">شهادة بحث</option>
                  <option value="افاده محلية">افاده محلية</option>
                  <option value="باسم البريد والبرق">باسم البريد والبرق</option>
                  <option value="بدون">بدون</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              {newProp.ownershipType === 'أخرى' && (
                <div style={styles.inputGroup}>
                  <label style={styles.infoLabel}>أدخل نوع الملكية:</label>
                  <input 
                    type="text" 
                    required
                    style={styles.inputField}
                    value={newProp.customOwnershipType}
                    onChange={(e) => setNewProp({...newProp, customOwnershipType: e.target.value})}
                    placeholder="اكتب نوع الملكية هنا..."
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.infoLabel}>المدينة:</label>
                <select 
                  required
                  style={styles.inputField}
                  value={newProp.cityId}
                  onChange={(e) => setNewProp({...newProp, cityId: e.target.value})}
                >
                  <option value="">اختر المدينة</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                <label style={styles.infoLabel}>تفاصيل إضافية / وصف العقار:</label>
                <textarea 
                  style={{ ...styles.inputField, height: '70px' }} 
                  value={newProp.details}
                  onChange={(e) => setNewProp({...newProp, details: e.target.value})}
                  placeholder="أي ملاحظات حول العقار..."
                />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>وحدات العقار الإيجارية</h4>
                  <button type="button" onClick={addUnitRow} style={styles.addUnitBtn}>+ إضافة وحدة</button>
                </div>

                <div style={styles.unitsContainer}>
                  {unitsList.map((unit, idx) => (
                    <div key={idx} style={styles.unitRow}>
                      <input 
                        type="text" 
                        required
                        placeholder="رقم الوحدة" 
                        style={{ ...styles.inputField, flex: 1.2 }}
                        value={unit.unitNumber}
                        onChange={(e) => handleUnitChange(idx, 'unitNumber', e.target.value)}
                      />
                      
                      <select 
                        style={{ ...styles.inputField, flex: 1.5 }}
                        value={unit.activityType}
                        onChange={(e) => handleUnitChange(idx, 'activityType', e.target.value)}
                      >
                        <option value="">نوع النشاط</option>
                        <option value="تجاري">تجاري</option>
                        <option value="إداري">إداري</option>
                        <option value="سكني">سكني</option>
                        <option value="خدمي">خدمي</option>
                        <option value="أخرى">أخرى</option>
                      </select>

                      {unit.activityType === 'أخرى' && (
                        <input 
                          type="text" 
                          required
                          placeholder="اكتب النشاط" 
                          style={{ ...styles.inputField, flex: 1.5 }}
                          value={unit.customActivityType}
                          onChange={(e) => handleUnitChange(idx, 'customActivityType', e.target.value)}
                        />
                      )}

                      <input 
                        type="number" 
                        placeholder="المساحة" 
                        style={{ ...styles.inputField, flex: 1 }}
                        value={unit.areaSize}
                        onChange={(e) => handleUnitChange(idx, 'areaSize', e.target.value)}
                      />
                      <select 
                        style={{ ...styles.inputField, flex: 1 }}
                        value={unit.status}
                        onChange={(e) => handleUnitChange(idx, 'status', e.target.value)}
                      >
                        <option value="متاحة">متاحة</option>
                        <option value="مؤجرة">مؤجرة</option>
                        <option value="صيانة">صيانة</option>
                      </select>
                      {unitsList.length > 1 && (
                        <button type="button" onClick={() => removeUnitRow(idx)} style={styles.removeUnitBtn}>🗑</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.cancelBtn}>إلغاء</button>
                <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ العقار والوحدات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageWrapper: { minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '40px' },
  navbar: { backgroundColor: '#ffffff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' },
  navBrand: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a' },
  navLinks: { display: 'flex', gap: '15px' },
  navLinkBtn: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', color: '#334155', fontWeight: '600' },

  container: { padding: '0 40px', maxWidth: '1400px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  backBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  
  addPropertyBtn: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  printActionBtn: { backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },

  title: { fontSize: '26px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '16px', color: '#64748b', marginTop: '4px' },
  
  mainLayout: { display: 'flex', gap: '25px', flexWrap: 'wrap-reverse', alignItems: 'flex-start' },
  rightSection: { flex: '1 1 68%', minWidth: '320px' },
  leftSection: { flex: '0 0 28%', minWidth: '280px' },

  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px', marginTop: '0' },
  statCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  statIconBox: { width: '50px', height: '50px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px' },
  statLabel: { fontSize: '15px', color: '#64748b', margin: '0 0 4px 0' },
  statNumber: { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0 },

  tableCard: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  tableHeaderSection: { padding: '18px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '14px 18px', fontSize: '16px', fontWeight: '700', color: '#334155' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 18px', fontSize: '16px', color: '#1e293b' },
  unitBadge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px' },
  noData: { textAlign: 'center', padding: '35px', color: '#64748b', fontSize: '16px' },

  paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flexWrap: 'wrap', gap: '10px' },
  paginationInfo: { fontSize: '14px', color: '#64748b' },
  paginationControls: { display: 'flex', alignItems: 'center', gap: '10px' },
  pageBtn: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155' },
  pageIndicator: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  rowsSelect: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff' },

  profileCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', textAlign: 'center' },
  avatarBox: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto' },
  profileName: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 6px 0' },
  profileRole: { fontSize: '15px', color: '#64748b', margin: 0 },
  divider: { margin: '20px 0', borderColor: '#f1f5f9', borderWidth: '1px', borderStyle: 'solid' },
  infoGroup: { textAlign: 'right', marginBottom: '16px' },
  infoLabel: { fontSize: '14px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' },
  infoValue: { fontSize: '16px', color: '#0f172a', margin: 0, fontWeight: '500' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '950px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  inputField: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none' },
  
  unitsContainer: { border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' },
  unitRow: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  
  addUnitBtn: { backgroundColor: '#f1f5f9', color: '#0284c7', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  removeUnitBtn: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  submitBtn: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },

  infoText: { color: '#64748b', fontSize: '16px', textAlign: 'center', marginTop: '50px' },
  errorText: { color: '#dc2626', fontSize: '16px', marginTop: '15px', textAlign: 'center' }
};