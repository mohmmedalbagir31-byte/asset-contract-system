import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

export default function UnitDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [unit, setUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // حالات ترقيم الصفحات لجدول العقود (10 عقود لكل صفحة)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchUnitData = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(`/propertyunit/${id}`);
      setUnit(response.data);
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول.');
      } else {
        setError(err.response?.data?.message || err.message || 'فشل في جلب بيانات الوحدة');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUnitData();
    }
  }, [id]);

  const contracts = unit?.contracts || [];
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'ساري').length;
  const expiredContracts = contracts.filter(c => c.status === 'منتهي' || c.status === 'ملغي').length;
  const totalValue = contracts.reduce((sum, c) => sum + (Number(c.contractValue) || 0), 0);

  // حساب العقود الخاصة بالصفحة الحالية
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentContracts = contracts.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(contracts.length / rowsPerPage);

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>جاري تحميل تفاصيل الوحدة...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>رجوع</button>
      </div>
    );
  }


  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← العودة للوحدات</button>

      {isLoading && <p style={styles.infoText}>جاري التحميل...</p>}
      {error && <p style={styles.errorText}>خطأ: {error}</p>}

      {/* الهيكل الرئيسي المقسم (يمين للعقود والإحصائيات، يسار لتفاصيل الوحدة) */}
      <div style={styles.mainLayout}>
        
        {/* القسم الأيمن (70%): الإحصائيات + جدول العقود الخاصة بالوحدة */}
        <div style={styles.rightSection}>
          
          {/* بطاقات الإحصائيات السريعة للعقود */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderRight: '4px solid #0ea5e9' }}>
              <span style={styles.statLabel}>إجمالي العقود</span>
              <span style={styles.statValue}>{totalContracts}</span>
            </div>
            <div style={{ ...styles.statCard, borderRight: '4px solid #22c55e' }}>
              <span style={styles.statLabel}>العقود السارية</span>
              <span style={styles.statValue}>{activeContracts}</span>
            </div>
            <div style={{ ...styles.statCard, borderRight: '4px solid #f97316' }}>
              <span style={styles.statLabel}>العقود المنتهية/الملغية</span>
              <span style={styles.statValue}>{expiredContracts}</span>
            </div>
            <div style={{ ...styles.statCard, borderRight: '4px solid #8b5cf6' }}>
              <span style={styles.statLabel}>إجمالي قيمة العقود</span>
              <span style={styles.statValue}>{totalValue.toLocaleString()}</span>
            </div>
          </div>

          <div style={styles.unitsHeader}>
            <h3 style={styles.sectionTitle}>قائمة عقود الوحدة</h3>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={{ ...styles.th, width: '5%' }}>#</th>
                  <th style={{ ...styles.th, width: '15%' }}>رقم العقد</th>
                  <th style={{ ...styles.th, width: '15%' }}>نوع العقد</th>
                  <th style={{ ...styles.th, width: '15%' }}>المستثمر</th>
                  <th style={{ ...styles.th, width: '12%' }}>القيمة</th>
                  <th style={{ ...styles.th, width: '13%' }}>الحالة</th>
                  <th style={{ ...styles.th, width: '25%' }}>الفترة</th>
                </tr>
              </thead>
              <tbody>
                {currentContracts.length > 0 ? (
                  currentContracts.map((contract, index) => (
                    <tr key={contract.id} style={styles.tableRow}>
                      <td style={styles.td}>{indexOfFirstRow + index + 1}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{contract.contractNumber}</td>
                      <td style={styles.td}>{contract.contractType || '-'}</td>
                      <td style={styles.td}>{contract.investorName}</td>
                      <td style={styles.td}>{contract.contractValue?.toLocaleString()}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: contract.status === 'ساري' ? '#dcfce7' : '#fee2e2',
                          color: contract.status === 'ساري' ? '#166534' : '#991b1b'
                        }}>
                          {contract.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.notesText}>{contract.startDate} إلى {contract.endDate}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={styles.noData}>لا توجد عقود مسجلة لهذه الوحدة حتى الآن</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* شريط ترقيم الصفحات للعقود */}
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
        </div>

        {/* القسم الأيسر (20%): بيانات الوحدة التفصيلية */}
        <div style={styles.leftSection}>
          {unit && (
            <div style={styles.propertyCard}>
              <div style={styles.propHeaderTop}>
                <div style={styles.propTitleWrapper}>
                  <span style={styles.propIconBox}>🚪</span>
                  <div>
                    <h2 style={styles.propTitle}>وحدة رقم: {unit.unitNumber}</h2>
                    <p style={styles.propSubtitle}>بيانات الوحدة الأساسية</p>
                  </div>
                </div>
              </div>

              <div style={styles.codeBadgeWrapper}>
                <span style={styles.codeBadge}>🏢 العقار: {unit.property?.name || 'N/A'}</span>
              </div>

              <div style={styles.propDivider}></div>

              <div style={styles.propDetailsList}>
                <div style={styles.propDetailItem}>
                  <span style={styles.detailIcon}>📌</span>
                  <div>
                    <span style={styles.detailLabel}>النشاط</span>
                    <span style={styles.detailValue}>{unit.activityType || '-'}</span>
                  </div>
                </div>

                <div style={styles.propDetailItem}>
                  <span style={styles.detailIcon}>📐</span>
                  <div>
                    <span style={styles.detailLabel}>المساحة</span>
                    <span style={styles.detailValue}>{unit.areaSize} م²</span>
                  </div>
                </div>

                <div style={styles.propDetailItem}>
                  <span style={styles.detailIcon}>⚡</span>
                  <div>
                    <span style={styles.detailLabel}>الحالة</span>
                    <span style={styles.detailValue}>{unit.status || '-'}</span>
                  </div>
                </div>
              </div>

              {unit.description && (
                <div style={styles.propDescriptionBox}>
                  <span style={styles.descIcon}>📝</span>
                  <div>
                    <span style={styles.detailLabel}>ملاحظات الوحدة:</span>
                    <p style={styles.descText}>{unit.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px 30px', maxWidth: '1400px', margin: '0 auto' },
  backBtn: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px', fontWeight: '600', fontSize: '14px' },
  
  mainLayout: { display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' },
  rightSection: { flex: '1', minWidth: '75%', display: 'flex', flexDirection: 'column' },
  leftSection: { width: '20%', minWidth: '300px' },

  propertyCard: { 
    backgroundColor: '#ffffff', 
    border: '1px solid #e2e8f0', 
    borderRadius: '14px', 
    padding: '20px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    background: 'linear-gradient(to bottom, #ffffff, #fcfcfc)',
    position: 'sticky',
    top: '20px'
  },
  propHeaderTop: { marginBottom: '12px' },
  propTitleWrapper: { display: 'flex', alignItems: 'center', gap: '12px' },
  propIconBox: { width: '42px', height: '42px', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', flexShrink: 0 },
  propTitle: { fontSize: '20px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  propSubtitle: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  codeBadgeWrapper: { marginBottom: '10px' },
  codeBadge: { backgroundColor: '#f8fafc', color: '#0369a1', border: '1px solid #bae6fd', padding: '5px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'inline-block' },
  propDivider: { height: '1px', backgroundColor: '#f1f5f9', margin: '12px 0' },
  propDetailsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  propDetailItem: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' },
  detailIcon: { fontSize: '18px' },
  detailLabel: { display: 'block', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  detailValue: { display: 'block', fontSize: '15px', color: '#1e293b', fontWeight: 'bold', marginTop: '1px' },
  propDescriptionBox: { display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9', marginTop: '10px' },
  descIcon: { fontSize: '18px', marginTop: '2px' },
  descText: { fontSize: '14px', color: '#334155', margin: '2px 0 0 0', lineHeight: '1.4' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' },
  statCard: { backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' },
  statLabel: { fontSize: '13px', color: '#64748b', fontWeight: '600' },
  statValue: { fontSize: '24px', color: '#0f172a', fontWeight: 'bold' },

  unitsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  sectionTitle: { fontSize: '18px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right', tableLayout: 'fixed' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  
  th: { padding: '12px 15px', fontSize: '16px', fontWeight: '700', color: '#334155', wordBreak: 'break-word' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 15px', fontSize: '16px', color: '#1e293b', verticalAlign: 'middle' },
  
  notesText: { 
    whiteSpace: 'pre-wrap', 
    wordBreak: 'break-word', 
    overflowWrap: 'break-word', 
    lineHeight: '1.5',
    color: '#334155',
    fontSize: '15px',
    fontWeight: '500'
  },

  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '15px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fff' },
  pageBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
  pageIndicator: { fontSize: '15px', fontWeight: '600', color: '#475569' },

  noData: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '15px' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
  infoText: { textAlign: 'center', color: '#64748b', padding: '20px', fontSize: '15px' },
  errorText: { textAlign: 'center', color: '#dc2626', padding: '20px', fontWeight: 'bold', fontSize: '15px' }
};