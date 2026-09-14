import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userRole, setUserRole] = useState('User');
  const [userFullName, setUserFullName] = useState('مستخدم النظام');

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // الفلترة والتقارير
  const [reportType, setReportType] = useState('contracts'); 
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // حالات ترقيم الصفحات (الصفحة الحالية وعدد الصفوف في الصفحة الواحدة = 10)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const storedRole = localStorage.getItem('role') || localStorage.getItem('Role') || 'User';
    setUserRole(storedRole);

    const storedName = localStorage.getItem('userFullName') || localStorage.getItem('fullName') || localStorage.getItem('name') || 'محمد الباقر';
    setUserFullName(storedName);

    fetchReportStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // العودة للصفحة الأولى عند تغير نوع التقرير أو حالة الفلترة
    fetchReportData();
  }, [reportType, filterStatus]);

  const fetchReportStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5210/api/reports/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5210/api/reports/data?type=${reportType}&status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('خطأ في جلب بيانات التقرير:', error);
      setReportData([]);
    } finally {
      setLoadingData(false);
    }
  };

  // الحصول على اسم التقرير بالعربية للطباعة (تم تصحيح هيكل الـ switch)
  const getReportTitleName = () => {
    switch (reportType) {
      case 'contracts': return 'تقرير العقودات الشامل';
      case 'payments': return 'تقرير الإيرادات والدفعيات (مالي)';
      case 'properties': return 'تقرير العقارات المسجلة';
      case 'units': return 'تقرير الوحدات الإيجارية';
      case 'investors': return 'تقرير المستثمرين';
      case 'owners': return 'تقرير الملاك';
      default: return 'تقرير عام';
    }
  };

  // تحديد عناوين الأعمدة ديناميكياً حسب نوع التقرير
  const getTableHeaders = () => {
    switch (reportType) {
      case 'contracts':
        return ['رقم العقد', 'نوع العقد', 'المستثمر', 'المدة', 'قيمة العقد', 'الحالة', 'تاريخ النهاية'];
      case 'properties':
        return ['كود العقار', 'اسم العقار', 'نوع الملكية', 'المالك', 'المدينة', 'التفاصيل', 'تاريخ الإنشاء'];
      case 'units':
        return ['رقم الوحدة', 'النشاط', 'العقار التابع', 'المساحة', 'الحالة', 'الوصف', '---'];
      case 'investors':
        return ['اسم المستثمر', 'رقم الهاتف', 'البريد الإلكتروني', 'رقم الهوية', 'العنوان', 'الحالة', 'انتهاء الهوية'];
      case 'owners':
        return ['اسم المالك', 'رقم الهاتف', 'البريد الإلكتروني', 'العنوان', '---', '---', '---'];
      case 'payments':
        return ['رقم العقد', 'المستثمر', 'إجمالي قيمة العقد', 'الإيجار الشهري', 'المحصل فعلياً', 'المبلغ المتبقي', 'حالة العقد'];
      default:
        return ['العمود 1', 'العمود 2', 'العمود 3', 'العمود 4', 'العمود 5', 'العمود 6', 'العمود 7'];
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(reportData.length / rowsPerPage);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = ['#', ...getTableHeaders()];
    const rows = reportData.map((row, index) => [
      index + 1,
      row.col1 || '',
      row.col2 || '',
      row.col3 || '',
      row.col4 || '',
      row.col5 || '',
      row.col6 || '',
      row.col7 || ''
    ]);

    const csvContent = '\uFEFF' + [
      headers.map(h => `"${h}"`).join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userRoleLower = (userRole || '').toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const isManager = userRoleLower === 'manager';
  const canViewConfig = isAdmin || isManager;
  const currentPath = location.pathname;

  const onLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={styles.dashboardContainer}>
      
      {/* النافبار */}
      <nav style={{ ...styles.navbar, direction: 'rtl' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={styles.brandIcon}>🏢</span>
          <span style={styles.brandTitle}>عقارات بريد السودان</span>
        </div>

        <div style={{ ...styles.navLinks, direction: 'ltr' }}>
          {canViewConfig && (
            <div style={styles.dropdownContainer}>
              <button onClick={() => setShowConfigDropdown(!showConfigDropdown)} style={styles.navLinkBtn}>التهيئة ▾</button>
              {showConfigDropdown && (
                <div style={styles.dropdownMenu}>
                  <div onClick={() => { navigate('/config'); setShowConfigDropdown(false); }} style={styles.dropdownItem}>رئيسية التهيئة</div>
                  <div onClick={() => { navigate('/sectors'); setShowConfigDropdown(false); }} style={styles.dropdownItem}>القطاعات</div>
                  <div onClick={() => { navigate('/localities'); setShowConfigDropdown(false); }} style={styles.dropdownItem}>المحليات</div>
                  <div onClick={() => { navigate('/cities'); setShowConfigDropdown(false); }} style={styles.dropdownItem}>المدن</div>
                  {isAdmin && <div onClick={() => { navigate('/users'); setShowConfigDropdown(false); }} style={styles.dropdownItem}>المستخدمين</div>}
                </div>
              )}
            </div>
          )}
          <button onClick={() => navigate('/reports')} style={currentPath === '/reports' ? {...styles.navLinkBtn, ...styles.activeLink} : styles.navLinkBtn}>التقارير</button>
          <button onClick={() => navigate('/properties')} style={styles.navLinkBtn}>العقارات</button>
          <button onClick={() => navigate('/contracts')} style={styles.navLinkBtn}>العقودات</button>
          <button onClick={() => navigate('/dashboard')} style={styles.navLinkBtn}>لوحة البيانات</button>
          <button onClick={() => navigate('/')} style={styles.navLinkBtn}>الرئيسية</button>
        </div>

        <div style={{ position: 'relative', direction: 'rtl' }}>
          <div style={styles.userDropdownContainer}>
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} style={styles.userToggleBtn}>
              <div style={styles.userAvatar}>{(userFullName || 'م')[0]}</div>
              <span>{userFullName} ({userRole})</span>
            </button>
            {showUserDropdown && (
              <div style={styles.userMenu}>
                <button onClick={onLogout} style={styles.logoutBtn}>تسجيل الخروج</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي */}
      <div style={styles.mainContent}>
        
        {/* رأس التقرير الرسمي للطباعة فقط */}
        <div className="print-header" style={styles.printHeaderStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '15px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#0f172a' }}>شركة بريد السودان - إدارة الاستثمار والعقارات</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>نظام إدارة العقارات والعقودات الشامل</p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>المستخدم: {userFullName}</p>
            </div>
          </div>
          <h1 style={{ textAlign: 'center', fontSize: '20px', color: '#0f172a', margin: '15px 0', textDecoration: 'underline' }}>
            {getReportTitleName()}
          </h1>
        </div>

        <div style={styles.pageHeader} className="no-print">
          <h1 style={styles.pageTitle}>تقارير النظام الشاملة</h1>
          <p style={styles.pageSubtitle}>استعراض بيانات العقارات، العقود، الوحدات، المستثمرين والملاك</p>
        </div>

        {/* بطاقات الإحصائيات */}
        {!loadingStats && stats && (
          <div style={styles.statsGrid} className="no-print">
            <div style={styles.statCard}>
              <div style={styles.statIconContainer}>🏢</div>
              <div>
                <p style={styles.statLabel}>إجمالي العقارات</p>
                <h3 style={styles.statValue}>{stats.totalProperties}</h3>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconContainer}>📄</div>
              <div>
                <p style={styles.statLabel}>إجمالي العقود</p>
                <h3 style={styles.statValue}>{stats.totalContracts}</h3>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconContainer}>✅</div>
              <div>
                <p style={styles.statLabel}>العقود السارية</p>
                <h3 style={styles.statValue}>{stats.activeContracts}</h3>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIconContainer}>⚠️</div>
              <div>
                <p style={styles.statLabel}>عقود قريبة الانتهاء</p>
                <h3 style={styles.statValue}>{stats.expiringContracts}</h3>
              </div>
            </div>
          </div>
        )}

        {/* شريط الفلترة */}
        <div style={styles.filterCard} className="no-print">
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>اختر التقرير:</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={styles.selectInput}>
              <option value="contracts">تقرير العقودات</option>
              <option value="payments">تقرير الإيرادات والدفعيات (مالي)</option>
              <option value="properties">تقرير العقارات</option>
              <option value="units">تقرير الوحدات الإيجارية</option>
              <option value="investors">تقرير المستثمرين</option>
              <option value="owners">تقرير الملاك</option>
            </select>
          </div>

          {(reportType === 'contracts' || reportType === 'units') && (
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>حالة التصفية:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.selectInput}>
                <option value="all">الكل</option>
                <option value="active">ساري / نشط</option>
                <option value="expired">منتهي</option>
              </select>
            </div>
          )}
        </div>

        {/* جدول عرض النتائج */}
        <div style={styles.tableCard} className="report-table-container">
          <div style={styles.tableHeaderSection} className="no-print">
            <h3 style={styles.tableTitle}>نتائج التقرير التفصيلي ({reportData.length} سجل)</h3>
            
            <div style={styles.actionButtonsContainer}>
              <button onClick={handlePrint} style={styles.printBtn}>
                🖨️ طباعة التقرير
              </button>
              <button onClick={handleExportExcel} style={styles.excelBtn}>
                📥 تصدير Excel
              </button>
            </div>
          </div>

          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '16px' }}>جاري تحميل البيانات...</div>
          ) : reportData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '16px' }}>لا توجد بيانات متاحة لهذا التقرير.</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table} className="professional-table">
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>#</th>
                      {getTableHeaders().map((header, idx) => (
                        <th key={idx} style={styles.th}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, index) => (
                      <tr key={row.id || index} style={styles.tableRow}>
                        <td style={styles.td}>{indexOfFirstRow + index + 1}</td>
                        <td style={styles.td}>{row.col1}</td>
                        <td style={styles.td}>{row.col2}</td>
                        <td style={styles.td}>{row.col3}</td>
                        <td style={styles.td}>{row.col4}</td>
                        <td style={styles.td}>{row.col5}</td>
                        <td style={styles.td}>{row.col6}</td>
                        <td style={styles.td}>{row.col7}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* شريط ترقيم الصفحات (Pagination) */}
              {totalPages > 1 && (
                <div style={styles.paginationContainer} className="no-print">
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
            </>
          )}

          {/* تذييل التقرير (يظهر فقط عند الطباعة) */}
          <div className="print-footer" style={{ display: 'none', marginTop: '40px', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
            <div>التوقيع والختم: ........................................</div>
            <div>المراجع المالي: ........................................</div>
          </div>
        </div>

      </div>

      <style>{`
        .print-header {
          display: none;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          .print-footer {
            display: flex !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 12pt;
          }
          .report-table-container {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .professional-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .professional-table th, .professional-table td {
            border: 1px solid #333 !important;
            padding: 8px !important;
            color: #000 !important;
            font-size: 11pt !important;
          }
          .professional-table th {
            background-color: #e2e8f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#f4f6f9', direction: 'rtl', fontFamily: 'Cairo, sans-serif' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', color: '#fff', padding: '0 30px', height: '70px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  brandIcon: { fontSize: '26px' },
  brandTitle: { fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '0.5px' },
  navLinks: { display: 'flex', gap: '5px', alignItems: 'center', height: '100%' },
  navLinkBtn: { background: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: '#cbd5e1', fontSize: '16px', fontWeight: '600', cursor: 'pointer', padding: '0 15px', height: '100%' },
  activeLink: { color: '#ffffff', borderBottom: '3px solid #38bdf8' },
  dropdownContainer: { position: 'relative', height: '100%', display: 'flex', alignItems: 'center' },
  dropdownMenu: { position: 'absolute', top: '70px', right: '0', backgroundColor: '#ffffff', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '8px', width: '180px', overflow: 'hidden', zIndex: 100 },
  dropdownItem: { padding: '12px 16px', fontSize: '16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' },
  userDropdownContainer: { position: 'relative' },
  userToggleBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 14px', borderRadius: '30px' },
  userAvatar: { width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px' },
  userMenu: { position: 'absolute', top: '45px', left: '0', backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '8px', width: '160px', overflow: 'hidden', zIndex: 100 },
  logoutBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#dc2626', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' },
  mainContent: { padding: '30px 40px', color: '#1e293b', maxWidth: '1400px', margin: '0 auto' },
  pageHeader: { marginBottom: '25px' },
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 5px 0' },
  pageSubtitle: { fontSize: '16px', color: '#64748b', margin: '0' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' },
  statCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0' },
  statIconContainer: { fontSize: '30px', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px' },
  statLabel: { fontSize: '16px', color: '#64748b', margin: '0 0 5px 0', fontWeight: '500' },
  statValue: { fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0' },
  filterCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', gap: '20px', marginBottom: '25px', border: '1px solid #e2e8f0', alignItems: 'center' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' },
  filterLabel: { fontSize: '16px', fontWeight: '600', color: '#475569' },
  selectInput: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', backgroundColor: '#fff', outline: 'none' },
  tableCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
  tableHeaderSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  tableTitle: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 },
  actionButtonsContainer: { display: 'flex', gap: '10px' },
  printBtn: { backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  excelBtn: { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px', fontSize: '16px', fontWeight: '600', color: '#475569' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 14px', fontSize: '16px', color: '#1e293b' },
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '15px' },
  pageBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' },
  pageIndicator: { fontSize: '16px', fontWeight: '600', color: '#475569' }
};