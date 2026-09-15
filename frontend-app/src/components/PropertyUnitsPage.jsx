import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

const ACTIVITY_TYPES = ['تجاري', 'إداري', 'سكني', 'خدمي'];
const STATUS_TYPES = ['شاغر', 'مؤجرة', 'صيانة'];

export default function PropertyUnitsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [currentUnit, setCurrentUnit] = useState({
    id: null,
    propertyId: Number(id),
    unitNumber: '',
    activityType: '',
    areaSize: '',
    status: 'شاغر',
    description: ''
  });

  const fetchPropertyData = async () => {
    setIsLoading(true);
    try {
      // جلب بيانات العقار ووحداته بشكل متوازي باستخدام الـ API المركزي
      const [propRes, unitsRes] = await Promise.all([
        API.get(`/property/${id}`),
        API.get(`/propertyunit/property/${id}`).catch(() => ({ data: [] }))
      ]);

      setProperty(propRes.data);
      setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
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
    if (id) {
      fetchPropertyData();
    }
  }, [id]);

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...currentUnit,
        id: currentUnit.id || 0,
        propertyId: Number(id),
        areaSize: parseFloat(currentUnit.areaSize) || 0
      };

      if (isEditing) {
        await API.put(`/propertyunit/${currentUnit.id}`, payload);
      } else {
        await API.post('/propertyunit', payload);
      }

      setShowModal(false);
      setCurrentUnit({
        id: null, propertyId: Number(id), unitNumber: '', activityType: '', areaSize: '', status: 'شاغر', description: ''
      });
      setIsEditing(false);
      fetchPropertyData();
    } catch (err) {
      let errorMsg = 'فشل حفظ بيانات الوحدة';
      if (err.response?.data?.errors) {
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        errorMsg = err.response.data.errors[firstErrorKey][0];
      } else {
        errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || errorMsg;
      }
      alert(errorMsg);
    }
  };

  const handleOpenEdit = (unit) => {
    setCurrentUnit({
      id: unit.id,
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber || '',
      activityType: unit.activityType || '',
      areaSize: unit.areaSize || '',
      status: unit.status || 'شاغر',
      description: unit.description || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الوحدة؟')) return;
    try {
      await API.delete(`/propertyunit/${unitId}`);
      fetchPropertyData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'فشل حذف الوحدة';
      alert(errorMsg);
    }
  };

  // دالة الطباعة المخصصة لفتح نافذة تقرير نظيفة ومرتبة بالكامل
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    
    const unitsRows = units.map((u, index) => `
      <tr>
        <td style="border: 1px solid #999; padding: 8px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #999; padding: 8px; font-weight: bold;">${u.unitNumber || ''}</td>
        <td style="border: 1px solid #999; padding: 8px;">${u.activityType || '-'}</td>
        <td style="border: 1px solid #999; padding: 8px; text-align: center;">${u.areaSize || 0}</td>
        <td style="border: 1px solid #999; padding: 8px; text-align: center;">${u.status || ''}</td>
        <td style="border: 1px solid #999; padding: 8px;">${u.description || '-'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>تقرير وحدات العقار - ${property?.name || ''}</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; padding: 20px; color: #000; direction: rtl; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header h2 { margin: 0; font-size: 22px; }
            .header p { margin: 5px 0 0 0; font-size: 13px; color: #555; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; background: #eee; padding: 6px 10px; border-right: 4px solid #333; }
            .property-info { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
            .property-info td { padding: 8px 10px; border: 1px solid #ccc; width: 50%; }
            .units-table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .units-table th { background-color: #f2f2f2; border: 1px solid #999; padding: 8px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>عقارات بريد السودان - تقرير وحدات العقار</h2>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          <div class="section-title">بيانات العقار الأساسية</div>
          <table class="property-info">
            <tr>
              <td><strong>اسم العقار:</strong> ${property?.name || '-'}</td>
              <td><strong>كود العقار:</strong> ${property?.propertyCode || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>نوع الملكية:</strong> ${property?.ownershipType || '-'}</td>
              <td><strong>المدينة:</strong> ${property?.city?.name || '-'}</td>
            </tr>
            <tr>
              <td><strong>المالك:</strong> ${property?.owner?.name || '-'}</td>
              <td><strong>إجمالي الوحدات:</strong> ${units.length} وحدة</td>
            </tr>
            ${property?.details ? `<tr><td colspan="2"><strong>الوصف والتفاصيل:</strong> ${property.details}</td></tr>` : ''}
          </table>

          <div class="section-title">قائمة الوحدات بالكامل (${units.length} وحدة)</div>
          <table class="units-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 20%;">رقم الوحدة</th>
                <th style="width: 15%;">النشاط</th>
                <th style="width: 15%;">المساحة (م²)</th>
                <th style="width: 15%;">الحالة</th>
                <th style="width: 30%;">الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${unitsRows}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const totalUnits = units.length;
  const vacantUnits = units.filter(u => u.status === 'شاغر').length;
  const rentedUnits = units.filter(u => u.status === 'مؤجرة').length;
  const maintenanceUnits = units.filter(u => u.status === 'صيانة').length;

  const totalPages = Math.ceil(units.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUnits = units.slice(indexOfFirstItem, indexOfLastItem);

  
  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={() => navigate('/properties')} style={styles.backBtn}>← العودة لإدارة العقارات</button>
        <button onClick={handlePrintReport} style={styles.printBtn}>🖨️ طباعة التقرير</button>
      </div>

      {isLoading && <p style={styles.infoText}>جاري التحميل...</p>}
      {error && <p style={styles.errorText}>خطأ: {error}</p>}

      {/* قسم تفاصيل العقار في الأعلى */}
      {property && (
        <div style={styles.propertyCard}>
          <div style={styles.propHeaderTop}>
            <div style={styles.propTitleWrapper}>
              <span style={styles.propIconBox}>🏢</span>
              <div>
                <h2 style={styles.propTitle}>{property.name}</h2>
                <p style={styles.propSubtitle}>بيانات العقار الأساسية</p>
              </div>
            </div>
            <span style={styles.codeBadge}>📌 الكود: {property.propertyCode || 'N/A'}</span>
          </div>

          <div style={styles.propDivider}></div>

          <div style={styles.propDetailsGrid}>
            <div style={styles.propDetailItem}>
              <span style={styles.detailIcon}>📜</span>
              <div>
                <span style={styles.detailLabel}>نوع الملكية</span>
                <span style={styles.detailValue}>{property.ownershipType || '-'}</span>
              </div>
            </div>

            <div style={styles.propDetailItem}>
              <span style={styles.detailIcon}>📍</span>
              <div>
                <span style={styles.detailLabel}>المدينة</span>
                <span style={styles.detailValue}>{property.city?.name || '-'}</span>
              </div>
            </div>

            <div style={styles.propDetailItem}>
              <span style={styles.detailIcon}>👤</span>
              <div>
                <span style={styles.detailLabel}>المالك</span>
                <span style={styles.detailValue}>{property.owner?.name || '-'}</span>
              </div>
            </div>
          </div>

          {property.details && (
            <div style={styles.propDescriptionBox}>
              <span style={styles.descIcon}>📝</span>
              <div>
                <span style={styles.detailLabel}>الوصف والتفاصيل:</span>
                <p style={styles.descText}>{property.details}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* بطاقات الإحصائيات (تظهر فقط في الشاشة العادية) */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderRight: '4px solid #0ea5e9' }}>
          <span style={styles.statLabel}>إجمالي الوحدات</span>
          <span style={styles.statValue}>{totalUnits}</span>
        </div>
        <div style={{ ...styles.statCard, borderRight: '4px solid #eab308' }}>
          <span style={styles.statLabel}>الوحدات الشاغرة</span>
          <span style={styles.statValue}>{vacantUnits}</span>
        </div>
        <div style={{ ...styles.statCard, borderRight: '4px solid #22c55e' }}>
          <span style={styles.statLabel}>الوحدات المؤجرة</span>
          <span style={styles.statValue}>{rentedUnits}</span>
        </div>
        <div style={{ ...styles.statCard, borderRight: '4px solid #f97316' }}>
          <span style={styles.statLabel}>تحت الصيانة</span>
          <span style={styles.statValue}>{maintenanceUnits}</span>
        </div>
      </div>

      <div style={styles.unitsHeader}>
        <h3 style={styles.sectionTitle}>قائمة الوحدات</h3>
        <button 
          onClick={() => {
            setCurrentUnit({
              id: null, propertyId: Number(id), unitNumber: '', activityType: '', areaSize: '', status: 'شاغر', description: ''
            });
            setIsEditing(false);
            setShowModal(true);
          }} 
          style={styles.addBtn}
        >
          + إضافة وحدة جديدة
        </button>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={{ ...styles.th, width: '5%' }}>#</th>
              <th style={{ ...styles.th, width: '15%' }}>رقم الوحدة</th>
              <th style={{ ...styles.th, width: '15%' }}>نشاط الوحدة</th>
              <th style={{ ...styles.th, width: '12%' }}>المساحة (م²)</th>
              <th style={{ ...styles.th, width: '13%' }}>الحالة</th>
              <th style={{ ...styles.th, width: '25%' }}>الملاحظات</th>
              <th style={{ ...styles.th, width: '15%' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentUnits.length > 0 ? (
              currentUnits.map((unit, index) => (
                <tr 
                  key={unit.id} 
                  style={styles.tableRow}
                  onClick={() => navigate(`/units/${unit.id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={styles.td}>{indexOfFirstItem + index + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 'bold' }}>{unit.unitNumber}</td>
                  <td style={styles.td}>{unit.activityType || '-'}</td>
                  <td style={styles.td}>{unit.areaSize}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: unit.status === 'شاغر' ? '#fef08a' : unit.status === 'مؤجرة' ? '#dcfce7' : '#ffedd5',
                      color: unit.status === 'شاغر' ? '#854d0e' : unit.status === 'مؤجرة' ? '#166534' : '#9a3412'
                    }}>
                      {unit.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.notesText}>{unit.description || '-'}</div>
                  </td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.actionButtons}>
                      <button onClick={() => handleOpenEdit(unit)} style={styles.editBtn}>تعديل</button>
                      <button onClick={() => handleDeleteUnit(unit.id)} style={styles.deleteBtn}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={styles.noData}>لا توجد وحدات مسجلة لهذا العقار حتى الآن</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {units.length > 0 && (
        <div style={styles.paginationContainer}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            السابق
          </button>
          <span style={styles.pageInfo}>الصفحة {currentPage} من {totalPages} (إجمالي: {units.length} وحدة)</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            التالي
          </button>
        </div>
      )}

      {/* Modal إضافة وتعديل وحدة */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{isEditing ? 'تعديل بيانات الوحدة' : 'إضافة وحدة جديدة للعقار'}</h3>
            <form onSubmit={handleSaveUnit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>رقم الوحدة *</label>
                  <input 
                    type="text" 
                    required 
                    value={currentUnit.unitNumber}
                    onChange={(e) => setCurrentUnit({ ...currentUnit, unitNumber: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>نوع النشاط *</label>
                  <select 
                    required
                    value={currentUnit.activityType}
                    onChange={(e) => setCurrentUnit({ ...currentUnit, activityType: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">اختر النشاط...</option>
                    {ACTIVITY_TYPES.map((act, idx) => (
                      <option key={idx} value={act}>{act}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>المساحة (م²) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={currentUnit.areaSize}
                    onChange={(e) => setCurrentUnit({ ...currentUnit, areaSize: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>حالة الوحدة *</label>
                  <select 
                    required
                    value={currentUnit.status}
                    onChange={(e) => setCurrentUnit({ ...currentUnit, status: e.target.value })}
                    style={styles.input}
                  >
                    {STATUS_TYPES.map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>ملاحظات</label>
                  <textarea 
                    value={currentUnit.description}
                    onChange={(e) => setCurrentUnit({ ...currentUnit, description: e.target.value })}
                    style={{ ...styles.input, height: '70px', resize: 'vertical' }}
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
    </div>
  );
}

const styles = {
  container: { padding: '20px 30px', maxWidth: '1400px', margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  backBtn: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  printBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },

  propertyCard: { 
    backgroundColor: '#ffffff', 
    border: '1px solid #e2e8f0', 
    borderRadius: '14px', 
    padding: '20px 25px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    marginBottom: '25px',
    background: 'linear-gradient(to bottom, #ffffff, #fcfcfc)'
  },
  propHeaderTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  propTitleWrapper: { display: 'flex', alignItems: 'center', gap: '12px' },
  propIconBox: { width: '45px', height: '45px', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px', flexShrink: 0 },
  propTitle: { fontSize: '22px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  propSubtitle: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  codeBadge: { backgroundColor: '#f8fafc', color: '#0369a1', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' },
  propDivider: { height: '1px', backgroundColor: '#f1f5f9', margin: '15px 0' },
  propDetailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' },
  propDetailItem: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' },
  detailIcon: { fontSize: '20px' },
  detailLabel: { display: 'block', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  detailValue: { display: 'block', fontSize: '15px', color: '#1e293b', fontWeight: 'bold', marginTop: '2px' },
  propDescriptionBox: { display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', marginTop: '15px' },
  descIcon: { fontSize: '20px', marginTop: '2px' },
  descText: { fontSize: '14px', color: '#334155', margin: '4px 0 0 0', lineHeight: '1.5' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' },
  statCard: { backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' },
  statLabel: { fontSize: '13px', color: '#64748b', fontWeight: '600' },
  statValue: { fontSize: '24px', color: '#0f172a', fontWeight: 'bold' },

  unitsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  sectionTitle: { fontSize: '20px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right', tableLayout: 'fixed' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '14px 16px', fontSize: '15px', fontWeight: '700', color: '#334155', wordBreak: 'break-word' },
  tableRow: { borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.2s ease' },
  td: { padding: '14px 16px', fontSize: '15px', color: '#1e293b', verticalAlign: 'middle' },
  notesText: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '100px', overflowY: 'auto', lineHeight: '1.5', color: '#334155', fontSize: '14px', fontWeight: '500' },

  actionButtons: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  noData: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '15px' },
  statusBadge: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
  editBtn: { backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  
  paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 5px' },
  pageBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' },
  pageInfo: { fontSize: '14px', color: '#475569', fontWeight: '600' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' },
  modalContent: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  inputGroup: { flex: '1', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { padding: '9px 11px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  saveBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '9px 18px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }
};