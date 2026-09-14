import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5210/api/contract';
const INVESTORS_API_URL = 'http://localhost:5210/api/investor';
const UNITS_API_URL = 'http://localhost:5210/api/propertyunit';
const CITIES_API_URL = 'http://localhost:5210/api/city';

export default function ContractsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userRole, setUserRole] = useState('User');
  const [userFullName, setUserFullName] = useState('مستخدم النظام');

  // --- حالات قائمة الطباعة المنسدلة (Print Dropdown) ---
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const printMenuRef = useRef(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role') || localStorage.getItem('Role') || 'User';
    setUserRole(storedRole);
    const storedName = localStorage.getItem('userFullName') || localStorage.getItem('fullName') || localStorage.getItem('name') || 'محمد الباقر';
    setUserFullName(storedName);

    // إغلاق قائمة الطباعة عند النقر خارجها
    const handleClickOutside = (event) => {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target)) {
        setShowPrintMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRoleLower = (userRole || '').toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const isManager = userRoleLower === 'manager';
  const canViewConfig = isAdmin || isManager;
  const currentPath = location.pathname;

  const onLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const [contracts, setContracts] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expiringContracts, setExpiringContracts] = useState([]);

  // --- حالات الترقيم (Pagination States - الافتراضي 10 عناصر) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // حالات الـ Modal الخاص بالإضافة والتعديل
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContract, setCurrentContract] = useState({
    id: null,
    contractNumber: '',
    contractType: 'إيجار عادي',
    duration: '',
    contractValue: '',
    annex: 0,
    annexSummary: '',
    monthlyRentValue: '',
    startDate: '',
    endDate: '',
    status: 'ساري',
    summary: '',
    investorId: '',
    propertyUnitId: '',
    cityId: '',
    createdBy: localStorage.getItem('username') || 'مسؤول النظام'
  });

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
      const [contractsRes, investorsRes, unitsRes, citiesRes] = await Promise.all([
        axios.get(API_URL, { headers }),
        axios.get(INVESTORS_API_URL, { headers }).catch(() => ({ data: [] })),
        axios.get(UNITS_API_URL, { headers }).catch(() => ({ data: [] })),
        axios.get(CITIES_API_URL, { headers }).catch(() => ({ data: [] }))
      ]);

      const contractsData = Array.isArray(contractsRes.data) ? contractsRes.data : [];
      setContracts(contractsData);
      setInvestors(Array.isArray(investorsRes.data) ? investorsRes.data : []);
      setAllUnits(Array.isArray(unitsRes.data) ? unitsRes.data : []);
      setCities(Array.isArray(citiesRes.data) ? citiesRes.data : []);
      
      checkExpiringContracts(contractsData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'فشل في جلب بيانات العقود');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExpiringContracts = (contractsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(today.getDate() + 60);
    sixtyDaysLater.setHours(23, 59, 59, 999);

    const alerts = contractsList.filter(c => {
      const isRunning = c.status === 'ساري' || c.status === 'نشط';
      if (!isRunning || !c.endDate) return false;

      const endDate = new Date(c.endDate);
      endDate.setHours(0, 0, 0, 0);

      return endDate >= today && endDate <= sixtyDaysLater;
    });

    setExpiringContracts(alerts);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setCurrentContract({
      id: null,
      contractNumber: '',
      contractType: 'إيجار عادي',
      duration: '',
      contractValue: '',
      annex: 0,
      annexSummary: '',
      monthlyRentValue: '',
      startDate: '',
      endDate: '',
      status: 'ساري',
      summary: '',
      investorId: '',
      propertyUnitId: '',
      cityId: '',
      createdBy: localStorage.getItem('username') || 'مسؤول النظام'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (contractItem) => {
    setCurrentContract({
      id: contractItem.id,
      contractNumber: contractItem.contractNumber || '',
      contractType: contractItem.contractType || 'إيجار عادي',
      duration: contractItem.duration || '',
      contractValue: contractItem.contractValue || '',
      annex: contractItem.annex || 0,
      annexSummary: contractItem.annexSummary || '',
      monthlyRentValue: contractItem.monthlyRentValue || '',
      startDate: contractItem.startDate ? contractItem.startDate.split('T')[0] : '',
      endDate: contractItem.endDate ? contractItem.endDate.split('T')[0] : '',
      status: contractItem.status || 'ساري',
      summary: contractItem.summary || '',
      investorId: contractItem.investorId || '',
      propertyUnitId: contractItem.propertyUnitId || '',
      cityId: contractItem.cityId || '',
      createdBy: contractItem.createdBy || (localStorage.getItem('username') || 'مسؤول النظام')
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const payload = {
        contractNumber: currentContract.contractNumber,
        contractType: currentContract.contractType,
        duration: currentContract.duration,
        contractValue: Number(currentContract.contractValue) || 0,
        annex: Number(currentContract.annex) || 0,
        annexSummary: currentContract.annexSummary || '',
        monthlyRentValue: Number(currentContract.monthlyRentValue) || 0,
        startDate: currentContract.startDate ? new Date(currentContract.startDate).toISOString() : new Date().toISOString(),
        endDate: currentContract.endDate ? new Date(currentContract.endDate).toISOString() : new Date().toISOString(),
        status: currentContract.status,
        summary: currentContract.summary || '',
        investorId: parseInt(currentContract.investorId, 10),
        propertyUnitId: parseInt(currentContract.propertyUnitId, 10),
        cityId: parseInt(currentContract.cityId, 10),
        createdBy: currentContract.createdBy
      };

      if (isEditing) {
        await axios.put(`${API_URL}/${currentContract.id}`, { ...payload, id: currentContract.id }, { headers });
      } else {
        await axios.post(API_URL, payload, { headers });
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("API Error:", err.response?.data);
      const serverMsg = err.response?.data?.title || JSON.stringify(err.response?.data) || err.message;
      alert(`فشل حفظ بيانات العقد: ${serverMsg}`);
    }
  };

  const getBaseContractValue = (c) => Number(c.contractValue) || 0;
  const getTotalContractValue = (c) => (Number(c.contractValue) || 0) + (Number(c.annex) || 0);
  const getTotalPaid = (c) => {
    if (!c.payments || c.payments.length === 0) return 0;
    return c.payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  };

  const getPaymentStatus = (c) => {
    const total = getTotalContractValue(c);
    const paid = getTotalPaid(c);
    if (paid >= total && total > 0) return { text: "مدفوع بالكامل", style: styles.badgePaid };
    if (paid > 0) return { text: "مدفوع جزئياً", style: styles.badgePartial };
    return { text: "لم يتم السداد", style: styles.badgeUnpaid };
  };

  const totalContractsCount = contracts.length;
  const activeContractsCount = contracts.filter(c => c.status === 'ساري' || c.status === 'نشط').length;
  const canceledContractsCount = contracts.filter(c => c.status === 'ملغي').length;
  const inactiveOrEndedCount = contracts.filter(c => c.status === 'منتهي' || c.status === 'ملغي').length;
  
  const totalBaseValuesSum = contracts.reduce((acc, c) => acc + getBaseContractValue(c), 0);
  const totalValuesWithAnnexSum = contracts.reduce((acc, c) => acc + getTotalContractValue(c), 0);
  const totalPaidSum = contracts.reduce((acc, c) => acc + getTotalPaid(c), 0);

  const filteredContracts = contracts.filter(c => {
    if (!c) return false;
    const contractNoMatch = c.contractNumber ? c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const investorMatch = c.investor?.name ? c.investor.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return contractNoMatch || investorMatch;
  });

  // --- حساب عناصر الترقيم (Pagination Logic) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  // دالة تنفيذ طباعة الـ PDF الشامل
  const handlePrintPDF = () => {
    setShowPrintMenu(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // دالة تصدير وطباعة الجدول بصيغة Excel (توليد ملف .xls مدعوم باللغة العربية)
  const handleExportExcel = () => {
    setShowPrintMenu(false);
    try {
      let tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Tahoma, sans-serif; direction: rtl; }
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #0ea5e9; color: #ffffff; border: 1px solid #000; padding: 10px; font-weight: bold; text-align: center; }
            td { border: 1px solid #000; padding: 8px; text-align: right; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center; color: #0f172a;">تقرير جدول العقودات والبيانات المالية</h2>
          <table>
            <thead>
              <tr>
                <th>رقم العقد</th>
                <th>نوع العقد</th>
                <th>المستثمر</th>
                <th>القيمة الأساسية</th>
                <th>قيمة العمولة</th>
                <th>الإجمالي (بالعمولة)</th>
                <th>المدفوع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
      `;

      filteredContracts.forEach(c => {
        tableHTML += `
          <tr>
            <td>${c.contractNumber || ''}</td>
            <td>${c.contractType || ''}</td>
            <td>${c.investor?.name || 'غير محدد'}</td>
            <td>${getBaseContractValue(c)}</td>
            <td>${Number(c.annex) || 0}</td>
            <td>${getTotalContractValue(c)}</td>
            <td>${getTotalPaid(c)}</td>
            <td>${c.status || ''}</td>
          </tr>
        `;
      });

      tableHTML += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contracts_Report_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("حدث خطأ أثناء تصدير ملف الإكسل: " + err.message);
    }
  };

  const availableUnits = allUnits.filter(u => {
    if (u.status === 'شاغر') return true;
    if (isEditing && Number(u.id) === Number(currentContract.propertyUnitId)) return true;
    return false;
  });

  return (
    <div style={styles.pageWrapper}>
      {/* النافبار العلوي الموحد */}
      <nav style={{ ...styles.navbar, direction: 'rtl' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={styles.brandIcon}>🏢</span>
          <span style={styles.brandTitle}>عقارات بريد السودان</span>
        </div>

        <div style={{ ...styles.navLinks, direction: 'ltr' }}>
          {canViewConfig && (
            <div style={styles.dropdownContainer}>
              <button 
                onClick={() => setShowConfigDropdown(!showConfigDropdown)} 
                style={(currentPath.startsWith('/config') || currentPath === '/sectors' || currentPath === '/localities' || currentPath === '/cities' || currentPath === '/users') ? {...styles.navLinkBtn, ...styles.activeLink} : styles.navLinkBtn}
              >
                التهيئة ▾
              </button>

              {showConfigDropdown && (
                <div style={styles.dropdownMenu}>
                  <div onClick={() => { navigate('/config'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/config' ? styles.dropdownItemActive : {})}}>رئيسية التهيئة</div>
                  <div onClick={() => { navigate('/sectors'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/sectors' ? styles.dropdownItemActive : {})}}>القطاعات</div>
                  <div onClick={() => { navigate('/localities'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/localities' ? styles.dropdownItemActive : {})}}>المحليات</div>
                  <div onClick={() => { navigate('/cities'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/cities' ? styles.dropdownItemActive : {})}}>المدن</div>
                  {isAdmin && (
                    <div onClick={() => { navigate('/users'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/users' ? styles.dropdownItemActive : {})}}>المستخدمين</div>
                  )}
                </div>
              )}
            </div>
          )}

          <button onClick={() => { navigate('/reports'); setShowConfigDropdown(false); }} style={currentPath === '/reports' ? {...styles.navLinkBtn, ...styles.activeLink} : styles.navLinkBtn}>التقارير</button>
          <button onClick={() => { navigate('/properties'); setShowConfigDropdown(false); }} style={(currentPath === '/properties' || currentPath.startsWith('/property-units/')) ? {...styles.navLinkBtn, ...styles.activeLink} : styles.navLinkBtn}>العقارات</button>
          <button onClick={() => { navigate('/contracts'); setShowConfigDropdown(false); }} style={currentPath === '/contracts' ? {...styles.navLinkBtn, ...styles.activeLink} : styles.navLinkBtn}>العقودات</button>
          <button onClick={() => { navigate('/dashboard'); setShowConfigDropdown(false); }} style={currentPath === '/dashboard' ? {...styles.navLinkBtn, ...styles.activeLink} : styles.navLinkBtn}>لوحة البيانات</button>
          <button onClick={() => { navigate('/'); setShowConfigDropdown(false); }} style={currentPath === '/' ? {...styles.navLinkBtn, ...styles.activeLink} : styles.navLinkBtn}>الرئيسية</button>
        </div>

        <div style={{ position: 'relative', direction: 'rtl' }}>
          <div style={styles.userDropdownContainer}>
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} style={styles.userToggleBtn}>
              <div style={styles.userAvatar}>{(userFullName || 'م')[0]}</div>
              <span>{userFullName} <span style={{opacity: 0.7, fontSize: '11px'}}>({userRole})</span></span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>

            {showUserDropdown && (
              <div style={{ ...styles.userMenu, left: '0', right: 'auto' }}>
                <button onClick={onLogout} style={styles.logoutBtn}>تسجيل الخروج</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={styles.container} className="no-print">

        {expiringContracts.length > 0 && (
          <div style={styles.alertBanner}>
            <div style={styles.alertHeader}>
              <span style={styles.alertIcon}>⚠️</span>
              <h4 style={styles.alertTitle}>تنبيه: يوجد {expiringContracts.length} عقد(عقود) ستنتهي خلال الشهرين القادمين!</h4>
            </div>
            <ul style={styles.alertList}>
              {expiringContracts.map(ec => {
                const daysLeft = Math.ceil((new Date(ec.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <li key={ec.id} style={styles.alertItem}>
                    <span>رقم العقد: <strong>{ec.contractNumber}</strong> | المستثمر: <strong>{ec.investor?.name || 'غير محدد'}</strong></span>
                    <span style={styles.alertBadge}>متبقي {daysLeft >= 0 ? daysLeft : 0} يوم على الانتهاء ({ec.endDate.split('T')[0]})</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div style={styles.headerRow}>
          <div style={styles.titleSection}>
            <div>
              <h2 style={styles.sectionTitle}>إدارة العقودات</h2>
              <p style={styles.sectionSubtitle}>عرض وإدارة العقود المالية والعمولات والدفعات</p>
            </div>
          </div>
          
          <div style={styles.headerActions}>
            {/* زر القائمة المنسدلة للطباعة والتصدير */}
            <div style={styles.printDropdownContainer} ref={printMenuRef}>
              <button onClick={() => setShowPrintMenu(!showPrintMenu)} style={styles.printMainBtn}>
                🖨️ طباعة وتصدير ▼
              </button>
              {showPrintMenu && (
                <div style={styles.printMenuDropdown}>
                  <button onClick={handlePrintPDF} style={styles.printOptionBtn}>
                    📄 طباعة PDF شامل (كروت وإحصائيات + جدول)
                  </button>
                  <button onClick={handleExportExcel} style={styles.printOptionBtn}>
                    📊 طباعة وتصدير الجدول Excel
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleOpenAdd} style={styles.addBtn}>
              + إضافة عقد جديد
            </button>
          </div>
        </div>

        {/* بطاقات الإحصائيات */}
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderRight: '4px solid #0ea5e9' }}>
            <p style={styles.statTitle}>إجمالي العقود الكلي</p>
            <p style={styles.statValue}>{totalContractsCount}</p>
          </div>
          <div style={{ ...styles.statCard, borderRight: '4px solid #10b981' }}>
            <p style={styles.statTitle}>العقود النشطة (السارية)</p>
            <p style={{ ...styles.statValue, color: '#059669' }}>{activeContractsCount}</p>
          </div>
          <div style={{ ...styles.statCard, borderRight: '4px solid #dc2626' }}>
            <p style={styles.statTitle}>العقود الملغية</p>
            <p style={{ ...styles.statValue, color: '#dc2626' }}>{canceledContractsCount}</p>
          </div>
          <div style={{ ...styles.statCard, borderRight: '4px solid #7c3aed' }}>
            <p style={styles.statTitle}>العقود غير النشطة / المنتهية</p>
            <p style={{ ...styles.statValue, color: '#7c3aed' }}>{inactiveOrEndedCount}</p>
          </div>
          <div style={{ ...styles.statCard, borderRight: '4px solid #f59e0b' }}>
            <p style={styles.statTitle}>إجمالي العقود (بدون عمولة)</p>
            <p style={{ ...styles.statValue, color: '#d97706' }}>{totalBaseValuesSum.toLocaleString()} ج.س</p>
          </div>
          <div style={{ ...styles.statCard, borderRight: '4px solid #6366f1' }}>
            <p style={styles.statTitle}>إجمالي العقود (بالعمولة)</p>
            <p style={{ ...styles.statValue, color: '#4f46e5' }}>{totalValuesWithAnnexSum.toLocaleString()} ج.س</p>
          </div>
          <div style={{ ...styles.statCard, borderRight: '4px solid #059669' }}>
            <p style={styles.statTitle}>إجمالي المبالغ المحصلة</p>
            <p style={{ ...styles.statValue, color: '#047857' }}>{totalPaidSum.toLocaleString()} ج.س</p>
          </div>
        </div>

        <div style={styles.searchContainer}>
          <input 
            type="text"
            placeholder="ابحث برقم العقد أو اسم المستثمر..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
        </div>

        {isLoading && <p style={styles.infoText}>جاري التحميل...</p>}
        {error && (
          <div style={styles.errorBox}>
            <span>خطأ: {error}</span>
            <button onClick={fetchData} style={styles.retryBtn}>إعادة المحاولة</button>
          </div>
        )}

        {/* جدول العقود */}
        {!isLoading && (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>رقم العقد</th>
                  <th style={styles.th}>نوع العقد</th>
                  <th style={styles.th}>المستثمر</th>
                  <th style={styles.th}>القيمة الأساسية</th>
                  <th style={styles.th}>الإجمالي (بالعمولة)</th>
                  <th style={styles.th}>المدفوع</th>
                  <th style={styles.th}>الحالة</th>
                  <th style={styles.th}>حالة السداد</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentContracts.length > 0 ? (
                  currentContracts.map((c) => {
                    const baseVal = getBaseContractValue(c);
                    const totalVal = getTotalContractValue(c);
                    const paidVal = getTotalPaid(c);
                    const statusObj = getPaymentStatus(c);
                    const isExpiringSoon = expiringContracts.some(ec => ec.id === c.id);

                    return (
                      <tr key={c.id} style={isExpiringSoon ? styles.tableRowExpiring : styles.tableRow}>
                        <td style={{ ...styles.td, fontWeight: 'bold' }}>{c.contractNumber}</td>
                        <td style={styles.td}>{c.contractType}</td>
                        <td style={styles.td}>{c.investor?.name || 'غير محدد'}</td>
                        <td style={styles.td}>{baseVal.toLocaleString()} ج.س</td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>{totalVal.toLocaleString()} ج.س</td>
                        <td style={{ ...styles.td, color: isExpiringSoon ? '#b91c1c' : '#059669', fontWeight: '600' }}>{paidVal.toLocaleString()} ج.س</td>
                        <td style={styles.td}>
                          <span style={c.status === 'ساري' || c.status === 'نشط' ? styles.badgeActive : styles.badgeInactive}>
                            {c.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={statusObj.style}>{statusObj.text}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button onClick={() => navigate(`/contracts/${c.id}/payments`)} style={styles.paymentBtn}>
                            التفاصيل والدفعات
                          </button>
                          <button onClick={() => handleOpenEdit(c)} style={styles.editBtn}>
                            تعديل
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={styles.noData}>لا توجد عقود مطابقة للبحث</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- شريط الترقيم (Pagination Controls) --- */}
        {filteredContracts.length > 0 && (
          <div style={styles.paginationContainer} className="no-print">
            <div style={styles.paginationInfo}>
              عرض الصفحة {currentPage} من {totalPages || 1} (إجمالي النتائج: {filteredContracts.length})
            </div>
            <div style={styles.paginationControls}>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={styles.pageSizeSelect}
              >
                <option value={5}>5 في الصفحة</option>
                <option value={10}>10 في الصفحة</option>
                <option value={20}>20 في الصفحة</option>
                <option value={50}>50 في الصفحة</option>
              </select>

              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ ...styles.pageBtn, ...(currentPage === 1 ? styles.pageBtnDisabled : {}) }}
              >
                السابق
              </button>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{ ...styles.pageBtn, ...((currentPage === totalPages || totalPages === 0) ? styles.pageBtnDisabled : {}) }}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Modal إضافة أو تعديل عقد */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContentLarge}>
              <h3 style={styles.modalTitle}>{isEditing ? 'تعديل بيانات العقد' : 'إضافة عقد جديد'}</h3>
              <form onSubmit={handleSaveContract} style={styles.formGrid}>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>رقم العقد *</label>
                  <input type="text" required value={currentContract.contractNumber} onChange={(e) => setCurrentContract({ ...currentContract, contractNumber: e.target.value })} style={styles.input} placeholder="أدخل رقم العقد" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>نوع العقد *</label>
                  <select required value={currentContract.contractType} onChange={(e) => setCurrentContract({ ...currentContract, contractType: e.target.value })} style={styles.input}>
                    <option value="إيجار عادي">إيجار عادي</option>
                    <option value="عقد تشييد">عقد تشييد</option>
                    <option value="استثمار طويل الأجل">استثمار طويل الأجل</option>
                    <option value="صيانة وتشغيل">صيانة وتشغيل</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>المستثمر *</label>
                  <select required value={currentContract.investorId} onChange={(e) => setCurrentContract({ ...currentContract, investorId: e.target.value })} style={styles.input}>
                    <option value="">-- اختر المستثمر --</option>
                    {investors.map(inv => (<option key={inv.id} value={inv.id}>{inv.name}</option>))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>الوحدة العقارية (الشاغرة فقط) *</label>
                  <select required value={currentContract.propertyUnitId} onChange={(e) => setCurrentContract({ ...currentContract, propertyUnitId: e.target.value })} style={styles.input}>
                    <option value="">-- اختر وحدة شاغرة --</option>
                    {availableUnits.map(u => (<option key={u.id} value={u.id}>وحدة رقم: {u.unitNumber} ({u.status})</option>))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>المدينة *</label>
                  <select required value={currentContract.cityId} onChange={(e) => setCurrentContract({ ...currentContract, cityId: e.target.value })} style={styles.input}>
                    <option value="">-- اختر المدينة --</option>
                    {cities.map(ct => (<option key={ct.id} value={ct.id}>{ct.name}</option>))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>مدة العقد *</label>
                  <input type="text" required value={currentContract.duration} onChange={(e) => setCurrentContract({ ...currentContract, duration: e.target.value })} style={styles.input} placeholder="مثال: سنة، 3 سنوات" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>قيمة العقد الأساسية *</label>
                  <input type="number" step="0.01" required value={currentContract.contractValue} onChange={(e) => setCurrentContract({ ...currentContract, contractValue: e.target.value })} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>قيمة العمولة (Annex)</label>
                  <input type="number" step="0.01" value={currentContract.annex} onChange={(e) => setCurrentContract({ ...currentContract, annex: e.target.value })} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>قيمة الإيجار الشهري</label>
                  <input type="number" step="0.01" value={currentContract.monthlyRentValue} onChange={(e) => setCurrentContract({ ...currentContract, monthlyRentValue: e.target.value })} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>حالة العقد *</label>
                  <select required value={currentContract.status} onChange={(e) => setCurrentContract({ ...currentContract, status: e.target.value })} style={styles.input}>
                    <option value="ساري">ساري</option>
                    <option value="منتهي">منتهي</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>تاريخ البداية *</label>
                  <input type="date" required value={currentContract.startDate} onChange={(e) => setCurrentContract({ ...currentContract, startDate: e.target.value })} style={styles.fullClickableDateInput} onClick={(e) => e.target.showPicker?.()} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>تاريخ النهاية *</label>
                  <input type="date" required value={currentContract.endDate} onChange={(e) => setCurrentContract({ ...currentContract, endDate: e.target.value })} style={styles.fullClickableDateInput} onClick={(e) => e.target.showPicker?.()} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>المستخدم الذي أنشأ العقد *</label>
                  <input type="text" required value={currentContract.createdBy} onChange={(e) => setCurrentContract({ ...currentContract, createdBy: e.target.value })} style={styles.input} placeholder="اسم الموظف" />
                </div>

                <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                  <label style={styles.label}>ملخص الاتفاق</label>
                  <textarea rows="2" value={currentContract.summary} onChange={(e) => setCurrentContract({ ...currentContract, summary: e.target.value })} style={styles.input} />
                </div>

                <div style={{ ...styles.modalActions, gridColumn: 'span 2' }}>
                  <button type="submit" style={styles.saveBtn}>حفظ البيانات</button>
                  <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>إلغاء</button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>

      {/* ======================= قسم طباعة الـ PDF المخصص بحجم خط مريح وورقة A4 الأفقي ======================= */}
      <div id="printable-area" className="print-only">
        <div style={styles.printHeader}>
          <h1 style={styles.printTitle}>تقرير العقودات والتحصيل المالي الشامل</h1>
          <p style={styles.printSubtitle}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <div className="print-section-comprehensive">
          <div style={styles.printStatsGrid}>
            <div style={styles.printStatCard}><strong>إجمالي العقود:</strong> {totalContractsCount}</div>
            <div style={styles.printStatCard}><strong>العقود النشطة:</strong> {activeContractsCount}</div>
            <div style={styles.printStatCard}><strong>العقود الملغية:</strong> {canceledContractsCount}</div>
            <div style={styles.printStatCard}><strong>الإجمالي بالعمولة:</strong> {totalValuesWithAnnexSum.toLocaleString()} ج.س</div>
            <div style={styles.printStatCard}><strong>المبالغ المحصلة:</strong> {totalPaidSum.toLocaleString()} ج.س</div>
          </div>
        </div>

        <div className="print-section-table">
          <h3 style={styles.printSectionTitle}>قائمة العقود والبيانات المالية التفصيلية</h3>
          <table style={styles.printTableData}>
            <thead>
              <tr style={{backgroundColor: '#e2e8f0'}}>
                <th style={styles.printTh}>رقم العقد</th>
                <th style={styles.printTh}>نوع العقد</th>
                <th style={styles.printTh}>المستثمر</th>
                <th style={styles.printTh}>القيمة الأساسية</th>
                <th style={styles.printTh}>الإجمالي (بالعمولة)</th>
                <th style={styles.printTh}>المدفوع</th>
                <th style={styles.printTh}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length > 0 ? (
                filteredContracts.map((c, idx) => (
                  <tr key={idx}>
                    <td style={styles.printTd}><strong>{c.contractNumber}</strong></td>
                    <td style={styles.printTd}>{c.contractType}</td>
                    <td style={styles.printTd}>{c.investor?.name || '---'}</td>
                    <td style={styles.printTd}>{getBaseContractValue(c).toLocaleString()} ج.س</td>
                    <td style={styles.printTd}>{getTotalContractValue(c).toLocaleString()} ج.س</td>
                    <td style={styles.printTd}>{getTotalPaid(c).toLocaleString()} ج.س</td>
                    <td style={styles.printTd}>{c.status}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" style={styles.printTdCenter}>لا توجد عقود مسجلة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ستايلات التحكم بالطباعة وورقة A4 الأفقي وبخطوط واضحة */}
      <style>{`
        .print-only { display: none; }
        @media print {
          body { background: #fff !important; font-family: Tahoma, sans-serif !important; font-size: 13px !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Tahoma, sans-serif', fontSize: '16px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', color: '#fff', padding: '0 30px', height: '70px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  brandIcon: { fontSize: '24px' },
  brandTitle: { fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '0.5px' },
  navLinks: { display: 'flex', gap: '5px', alignItems: 'center', height: '100%' },
  navLinkBtn: { background: 'transparent', border: 'none', borderBottom: '3px solid transparent', color: '#cbd5e1', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '0 15px', height: '100%', transition: 'color 0.2s' },
  activeLink: { color: '#ffffff', borderBottom: '3px solid #38bdf8' },
  dropdownContainer: { position: 'relative', height: '100%', display: 'flex', alignItems: 'center' },
  dropdownMenu: { position: 'absolute', top: '70px', right: '0', backgroundColor: '#ffffff', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '8px', width: '180px', overflow: 'hidden', zIndex: 100, border: '1px solid #e2e8f0' },
  dropdownItem: { padding: '12px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: '500' },
  dropdownItemActive: { backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#0284c7' },
  userDropdownContainer: { position: 'relative' },
  userToggleBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 14px', borderRadius: '30px' },
  userAvatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' },
  userMenu: { position: 'absolute', top: '45px', left: '0', backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '8px', width: '160px', overflow: 'hidden', zIndex: 100, border: '1px solid #e2e8f0' },
  logoutBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#dc2626', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' },
  container: { padding: '20px 30px', width: '100%', boxSizing: 'border-box' },

  // --- ستايلات القائمة المنسدلة للطباعة والتصدير ---
  printDropdownContainer: { position: 'relative', display: 'inline-block' },
  printMainBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  printMenuDropdown: { position: 'absolute', left: 0, top: '100%', marginTop: '5px', backgroundColor: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid #e2e8f0', zIndex: 1000, display: 'flex', flexDirection: 'column', width: '290px' },
  printOptionBtn: { background: 'none', border: 'none', padding: '12px 15px', textAlign: 'right', fontSize: '15px', color: '#334155', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' },

  alertBanner: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRight: '5px solid #f59e0b', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px' },
  alertHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  alertIcon: { fontSize: '20px' },
  alertTitle: { fontSize: '16px', fontWeight: 'bold', color: '#92400e', margin: 0 },
  alertList: { margin: 0, paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '6px' },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', color: '#78350f', flexWrap: 'wrap', gap: '10px' },
  alertBadge: { backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', border: '1px solid #fcd34d' },

  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  sectionTitle: { fontSize: '18px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  sectionSubtitle: { fontSize: '14px', color: '#64748b', marginTop: '5px' },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' },
  statCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' },
  statTitle: { fontSize: '14px', color: '#64748b', margin: '0 0 8px 0' },
  statValue: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 },

  searchContainer: { marginBottom: '20px' },
  searchInput: { width: '100%', maxWidth: '400px', padding: '12px 15px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none', backgroundColor: '#fff' },
  
  infoText: { color: '#64748b', fontSize: '16px' },
  errorBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 20px', borderRadius: '6px', marginBottom: '15px', fontSize: '16px' },
  retryBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  
  tableCard: { backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '15px 15px', fontSize: '15px', fontWeight: '700', color: '#334155' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  tableRowExpiring: { backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' },
  td: { padding: '15px 15px', fontSize: '15px', color: '#1e293b' },
  noData: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '16px' },

  // --- ستايلات الترقيم (Pagination Styles) ---
  paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', marginTop: '15px' },
  paginationInfo: { fontSize: '14px', color: '#64748b', fontWeight: '600' },
  paginationControls: { display: 'flex', gap: '10px', alignItems: 'center' },
  pageSizeSelect: { padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', fontSize: '14px', color: '#334155', outline: 'none', cursor: 'pointer' },
  pageBtn: { padding: '6px 14px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  pageBtnDisabled: { backgroundColor: '#cbd5e1', color: '#64748b', cursor: 'not-allowed' },

  badgeActive: { backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  badgePaid: { backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  badgePartial: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  badgeUnpaid: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },

  paymentBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginLeft: '6px' },
  editBtn: { backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContentLarge: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
  fullClickableDateInput: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' },
  saveBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },

  // ستايلات قسم طباعة الـ PDF المخصص بخطوط واضحة
  printHeader: { textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' },
  printTitle: { fontSize: '22px', fontWeight: 'bold', margin: '0 0 5px 0' },
  printSubtitle: { fontSize: '13px', color: '#333', margin: 0 },
  printSectionTitle: { fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '8px 12px', borderRight: '4px solid #0ea5e9', margin: '20px 0 10px 0' },
  printStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' },
  printStatCard: { border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', backgroundColor: '#f8fafc', fontSize: '13px' },
  printTableData: { width: '100%', borderCollapse: 'collapse', marginTop: '5px', fontSize: '13px' },
  printTh: { border: '1px solid #cbd5e1', padding: '9px', backgroundColor: '#f1f5f9', textAlign: 'right', fontWeight: 'bold' },
  printTd: { border: '1px solid #cbd5e1', padding: '9px', textAlign: 'right' },
  printTdCenter: { border: '1px solid #cbd5e1', padding: '20px', textAlign: 'center', color: '#64748b' }
};