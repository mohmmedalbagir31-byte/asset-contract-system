import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

export default function InvestorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [investor, setInvestor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvestorDetails = async () => {
    setIsLoading(true);
    try {
      const res = await API.get(`/investor/${id}`);
      setInvestor(res.data);
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

  useEffect(() => {
    fetchInvestorDetails();
  }, [id]);

  if (isLoading) {
    return <div style={styles.container}><p style={styles.infoText}>جاري تحميل تفاصيل المستثمر...</p></div>;
  }

  if (error || !investor) {
    return (
      <div style={styles.container}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>⬅ رجوع</button>
        <p style={styles.errorText}>{error || 'لم يتم العثور على المستثمر المطلوب'}</p>
      </div>
    );
  }

  const contractsList = investor.contracts || investor.Contracts || [];
  const totalContracts = contractsList.length;
  const activeContracts = contractsList.filter(c => c.status === 'ساري').length;
  const totalMonthlyRent = contractsList.reduce((acc, c) => acc + (c.monthlyRentValue || 0), 0);

  
  return (
    <div style={styles.pageWrapper}>
      {/* تنسيقات الطباعة الخاصة */}
      <style>
        {`
          @media print {
            button, nav, div[style*="navbar"], .no-print {
              display: none !important;
            }
            body {
              background-color: #ffffff !important;
              font-family: 'Cairo', sans-serif !important;
              direction: rtl !important;
            }
            div[style*="pageWrapper"] {
              padding: 0 !important;
              background-color: #ffffff !important;
            }
            div[style*="infoCard"], div[style*="statCard"], div[style*="tableCard"] {
              box-shadow: none !important;
              border: 1px solid #cbd5e1 !important;
              break-inside: avoid;
            }
            tr {
              break-inside: avoid;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        `}
      </style>

      {/* الشريط العلوي (Navbar) */}
      <div style={styles.navbar}>
        <div style={styles.navBrand}>🏢 نظام إدارة العقود والأصول</div>
        <div style={styles.navLinks}>
          <button onClick={() => navigate('/investors')} style={styles.navLinkBtn}>إدارة المستثمرين</button>
          <button onClick={() => navigate('/')} style={styles.navLinkBtn}>الرئيسية</button>
        </div>
      </div>

      <div style={styles.container}>
        {/* هيدر الصفحة */}
        <div style={styles.headerRow}>
          <div style={styles.titleSection}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>⬅ رجوع </button>
            <div>
              <h2 style={styles.title}>ملف المستثمر: {investor.name}</h2>
              <p style={styles.subtitle}>عرض كافّة العقود والعقارات والبيانات الخاصة بالمستثمر</p>
            </div>
          </div>
          <div>
            <button onClick={() => window.print()} style={styles.printBtn}>🖨️ طباعة الملف</button>
          </div>
        </div>

        {/* 1. معلومات المستثمر بالعرض الكامل قبل الجدول */}
        <div style={styles.infoCard}>
          <div style={styles.infoHeaderRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={styles.avatarBox}>
                <span style={{ fontSize: '28px' }}>👤</span>
              </div>
              <div>
                <h3 style={styles.profileName}>{investor.name}</h3>
                <span style={styles.profileRole}>مستثمر عقاري</span>
              </div>
            </div>
            <div>
              <span style={{ 
                backgroundColor: investor.isActive ? '#dcfce7' : '#fee2e2', 
                color: investor.isActive ? '#166534' : '#991b1b', 
                padding: '6px 14px', 
                borderRadius: '12px', 
                fontSize: '13px', 
                fontWeight: '700' 
              }}>
                {investor.isActive ? 'نشط' : 'موقف'}
              </span>
            </div>
          </div>

          <hr style={styles.divider} />

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📱 رقم الهاتف:</span>
              <p style={styles.infoValue}>{investor.phoneNumber || 'غير مدخل'}</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📧 البريد الإلكتروني:</span>
              <p style={styles.infoValue}>{investor.email || 'غير مدخل'}</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📍 العنوان:</span>
              <p style={styles.infoValue}>{investor.address || 'غير مدخل'}</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>🪪 نوع ورقم الهوية:</span>
              <p style={styles.infoValue}>{investor.idType || '-'} : {investor.idNumber || 'غير مدخل'}</p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📅 تاريخ الإصدار / الانتهاء:</span>
              <p style={styles.infoValue}>
                {investor.issueDate ? new Date(investor.issueDate).toLocaleDateString('ar-SA') : '-'} إلى {investor.expiryDate ? new Date(investor.expiryDate).toLocaleDateString('ar-SA') : '-'}
              </p>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>🏛 مكان الإصدار:</span>
              <p style={styles.infoValue}>{investor.issuePlace || 'غير مدخل'}</p>
            </div>
          </div>
        </div>

        {/* 2. كروت الإحصائيات في سطر واحد أفقياً */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#e0f2fe', color: '#0369a1' }}>📄</div>
            <div>
              <p style={styles.statLabel}>إجمالي العقود</p>
              <h3 style={styles.statNumber}>{totalContracts}</h3>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#dcfce7', color: '#166534' }}>✅</div>
            <div>
              <p style={styles.statLabel}>العقود السارية</p>
              <h3 style={styles.statNumber}>{activeContracts}</h3>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconBox, backgroundColor: '#fef3c7', color: '#b45309' }}>💰</div>
            <div>
              <p style={styles.statLabel}>إجمالي الإيجار الشهري</p>
              <h3 style={styles.statNumber}>{totalMonthlyRent} د.ل</h3>
            </div>
          </div>
        </div>

        {/* 3. جدول العقود والعقارات المستأجرة بالعرض الكامل */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeaderSection}>
            <h3 style={styles.sectionTitle}>قائمة العقود المستأجرة (اضغط على العقد للتفاصيل)</h3>
          </div>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>رقم العقد</th>
                <th style={styles.th}>نوع العقد</th>
                <th style={styles.th}>العقار</th>
                <th style={styles.th}>رقم الوحدة</th>
                <th style={styles.th}>الإيجار الشهري</th>
                <th style={styles.th}>التاريخ</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {contractsList.length > 0 ? (
                contractsList.map((contract, index) => (
                  <tr 
                    key={contract.id || index} 
                    style={styles.tableRowClickable}
                    onClick={() => navigate(`/contracts/${contract.id}/payments`)}
                    title="انقر لعرض تفاصيل العقد والدفعات"
                  >
                    <td style={styles.td}>
                      <span style={{ fontWeight: 'bold', color: '#0284c7' }}>
                        {contract.contractNumber || '-'}
                      </span>
                    </td>
                    <td style={styles.td}>{contract.contractType || '-'}</td>
                    <td style={{ ...styles.td, fontWeight: '500' }}>{contract.propertyName || '-'}</td>
                    <td style={styles.td}>{contract.unitNumber || '-'}</td>
                    <td style={styles.td}>{contract.monthlyRentValue} د.ل</td>
                    <td style={styles.td}>
                      {contract.startDate ? new Date(contract.startDate).toLocaleDateString('ar-SA') : '-'}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: contract.status === 'ساري' ? '#dcfce7' : '#f1f5f9',
                        color: contract.status === 'ساري' ? '#166534' : '#334155',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}>
                        {contract.status || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={styles.noData}>لا توجد عقود مسجلة لهذا المستثمر حتى الآن</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

const styles = {
  pageWrapper: { minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '40px', direction: 'rtl', fontFamily: 'Cairo, sans-serif' },
  navbar: { backgroundColor: '#ffffff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' },
  navBrand: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a' },
  navLinks: { display: 'flex', gap: '15px' },
  navLinkBtn: { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '15px', color: '#334155', fontWeight: '600' },

  container: { padding: '0 40px', maxWidth: '1400px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' },
  backBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  printBtn: { backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  title: { fontSize: '26px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  subtitle: { fontSize: '16px', color: '#64748b', marginTop: '4px' },
  
  // كرت بيانات المستثمر بالعرض الكامل
  infoCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', marginBottom: '20px' },
  infoHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  avatarBox: { width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 2px 0' },
  profileRole: { fontSize: '14px', color: '#64748b', margin: 0 },
  divider: { margin: '18px 0', borderColor: '#f1f5f9', borderWidth: '1px', borderStyle: 'solid' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' },
  infoItem: { textAlign: 'right' },
  infoLabel: { fontSize: '13px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '3px' },
  infoValue: { fontSize: '15px', color: '#0f172a', margin: 0, fontWeight: '500' },

  // إحصائيات في سطر واحد أفقياً
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' },
  statCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' },
  statIconBox: { width: '50px', height: '50px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px' },
  statLabel: { fontSize: '15px', color: '#64748b', margin: '0 0 4px 0' },
  statNumber: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 },

  tableCard: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  tableHeaderSection: { padding: '18px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '14px 18px', fontSize: '15px', fontWeight: '700', color: '#334155' },
  tableRowClickable: { borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.2s' },
  td: { padding: '14px 18px', fontSize: '15px', color: '#1e293b' },
  noData: { textAlign: 'center', padding: '35px', color: '#64748b', fontSize: '16px' },

  infoText: { color: '#64748b', fontSize: '16px', textAlign: 'center', marginTop: '50px' },
  errorText: { color: '#dc2626', fontSize: '16px', marginTop: '15px', textAlign: 'center' }
};