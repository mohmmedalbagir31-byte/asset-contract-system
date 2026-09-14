import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';

import SectorsPage from './SectorsPage';
import Statespage from './Statespage';
import CitiesPage from './CitiesPage';
import PropertiesPage from './PropertiesPage';
import UsersPage from './UsersPage';
import InvestorsPage from "./InvestorsPage";
import OwnersPage from "./OwnersPage";
import PropertyUnitsPage from './PropertyUnitsPage'; 

export default function Dashboard({ userFullName, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userRole, setUserRole] = useState('User');

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('role') || localStorage.getItem('Role') || 'User';
    setUserRole(storedRole);
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5210/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الداشبورد:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const userRoleLower = (userRole || '').toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const isManager = userRoleLower === 'manager';
  const canViewConfig = isAdmin || isManager;
  const currentPath = location.pathname;

  const homeCards = [
    { id: 'contracts', title: 'العقودات', icon: '📄', path: '/contracts', desc: 'إدارة وتوثيق العقود اليومية' },
    { id: 'assets', title: 'العقارات', icon: '🏢', path: '/properties', desc: 'إدارة الأصول والوحدات العقارية' },
    { id: 'reports', title: 'التقارير', icon: '📊', path: '/reports', desc: 'التقارير المالية وإحصائيات الأداء' },
    { id: 'investors', title: 'المستثمرين', icon: '👥', path: '/investors', desc: 'إدارة بيانات المستثمرين والشركاء' },
    { id: 'owners', title: 'الملاك', icon: '🔑', path: '/owners', desc: 'سجلات ملاك العقارات والأملاك' },
    ...(canViewConfig ? [{ id: 'config-home', title: 'التهيئة', icon: '⚙️', path: '/config', desc: 'إعدادات النظام والقطاعات الجغرافية' }] : []),
  ];

  const configCards = [
    { id: 'sectors', title: 'القطاعات', icon: '📁', path: '/sectors' },
    { id: 'localities', title: 'الولايات', icon: '📍', path: '/localities' },
    { id: 'cities', title: 'المدن', icon: '🏙️', path: '/cities' },
    ...(isAdmin ? [{ id: 'users', title: 'المستخدمين', icon: '👤', path: '/users' }] : []),
  ];

  return (
    <div style={styles.dashboardContainer}>
      {/* Navbar احترافي */}
      {/* Navbar احترافي */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <span style={styles.brandIcon}>🏢</span>
          <span style={styles.brandTitle}>عقارات بريد السودان</span>
        </div>

        <div style={styles.navLinks}>
          <button 
            onClick={() => { navigate('/'); setShowConfigDropdown(false); }} 
            style={{ ...styles.navLinkBtn, ...(currentPath === '/' ? styles.activeLink : {}) }}
          >
            الرئيسية
          </button>

          <button 
            onClick={() => { navigate('/dashboard'); setShowConfigDropdown(false); fetchDashboardStats(); }} 
            style={{ ...styles.navLinkBtn, ...(currentPath === '/dashboard' ? styles.activeLink : {}) }}
          >
            لوحة البيانات
          </button>

          <button 
            onClick={() => { navigate('/contracts'); setShowConfigDropdown(false); }} 
            style={{ ...styles.navLinkBtn, ...(currentPath === '/contracts' ? styles.activeLink : {}) }}
          >
            العقودات
          </button>

          <button 
            onClick={() => { navigate('/properties'); setShowConfigDropdown(false); }} 
            style={{ ...styles.navLinkBtn, ...((currentPath === '/properties' || currentPath.startsWith('/property-units/')) ? styles.activeLink : {}) }}
          >
            العقارات
          </button>

          <button 
            onClick={() => { navigate('/reports'); setShowConfigDropdown(false); }} 
            style={{ ...styles.navLinkBtn, ...(currentPath === '/reports' ? styles.activeLink : {}) }}
          >
            التقارير
          </button>

          {canViewConfig && (
            <div style={styles.dropdownContainer}>
              <button 
                onClick={() => setShowConfigDropdown(!showConfigDropdown)} 
                style={{ 
                  ...styles.navLinkBtn, 
                  ...((currentPath === '/config' || currentPath === '/sectors' || currentPath === '/localities' || currentPath === '/cities' || currentPath === '/users') ? styles.activeLink : {}) 
                }}
              >
                التهيئة ▾
              </button>

              {showConfigDropdown && (
                <div style={styles.dropdownMenu}>
                  <div onClick={() => { navigate('/config'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/config' ? styles.dropdownItemActive : {})}}>رئيسية التهيئة</div>
                  <div onClick={() => { navigate('/sectors'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/sectors' ? styles.dropdownItemActive : {})}}>القطاعات</div>
                  <div onClick={() => { navigate('/localities'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/localities' ? styles.dropdownItemActive : {})}}>الولايات</div>
                  <div onClick={() => { navigate('/cities'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/cities' ? styles.dropdownItemActive : {})}}>المدن</div>
                  {isAdmin && (
                    <div onClick={() => { navigate('/users'); setShowConfigDropdown(false); }} style={{...styles.dropdownItem, ...(currentPath === '/users' ? styles.dropdownItemActive : {})}}>المستخدمين</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.userSection}>
          <div style={styles.userDropdownContainer}>
            <button onClick={() => setShowUserDropdown(!showUserDropdown)} style={styles.userToggleBtn}>
              <div style={styles.userAvatar}>{(userFullName || 'م')[0]}</div>
              <span>{userFullName || 'مستخدم النظام'} <span style={{opacity: 0.7, fontSize: '12px'}}>({userRole})</span></span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>

            {showUserDropdown && (
              <div style={styles.userMenu}>
                <button onClick={onLogout} style={styles.logoutBtn}>
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={styles.mainContent}>
        <Routes>
          {/* 1. الصفحة الرئيسية */}
          <Route path="/" element={
            <div>
              <div style={styles.welcomeBanner}>
                <div>
                  <h2 style={styles.welcomeTitle}>مرحباً بك، {userFullName || 'مستخدم النظام'} 👋</h2>
                  <p style={styles.welcomeSubtitle}>نظام إدارة العقارات والعقودات - نظرة سريعة على وحدات النظام والأقسام المتاحة.</p>
                </div>
                <div style={styles.systemBadge}>إصدار النظام 1.0</div>
              </div>

              <div style={styles.grid}>
                {homeCards.map((card) => (
                  <div 
                    key={card.id} 
                    style={styles.card}
                    onClick={() => navigate(card.path)}
                  >
                    <div style={styles.cardHeaderTop}>
                      <div style={styles.iconContainer}>{card.icon}</div>
                      <span style={styles.cardArrow}>➔</span>
                    </div>
                    <span style={styles.cardTitle}>{card.title}</span>
                    <p style={styles.cardDesc}>{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          } />
          
          {/* 2. لوحة البيانات الاحترافية (Dashboard) */}
          <Route path="/dashboard" element={
            <div>
              <div style={styles.pageHeader}>
                <div>
                  <h2 style={styles.pageTitle}>لوحة مؤشرات الأداء (Dashboard)</h2>
                  <p style={styles.pageSubtitle}>متابعة حية لحالة الأصول، التحصيلات المالية، والتنبيهات الإدارية.</p>
                </div>
                <button onClick={fetchDashboardStats} style={styles.refreshBtn}>
                  🔄 تحديث البيانات
                </button>
              </div>

              {loadingStats ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p style={{color: '#64748b', marginTop: '15px'}}>جاري تحميل المؤشرات وتحليل البيانات...</p>
                </div>
              ) : stats ? (
                <div>
                  {/* أبطق بطاقات المؤشرات (KPI Cards) */}
                  <div style={styles.statsGrid}>
                    
                    <div style={styles.statCard}>
                      <div style={styles.statIconBoxBg1}>🏢</div>
                      <div>
                        <span style={styles.statLabel}>إجمالي العقارات</span>
                        <span style={styles.statValue}>{stats.counts.totalProperties}</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statIconBoxBg2}>🚪</div>
                      <div style={{width: '100%'}}>
                        <span style={styles.statLabel}>إجمالي الوحدات</span>
                        <div style={{...styles.statValue, margin: '2px 0 10px 0'}}>
                          {stats.counts.totalUnits}
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px'}}>
                          <span style={{color: '#059669', fontWeight: 'bold'}}>مؤجرة: {stats.counts.rentedUnits}</span>
                          <span style={{color: '#d97706', fontWeight: 'bold'}}>شاغرة: {stats.counts.vacantUnits}</span>
                          <span style={{color: '#dc2626', fontWeight: 'bold'}}>صيانة: {stats.counts.maintenanceUnits}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statIconBoxBg3}>📄</div>
                      <div style={{width: '100%'}}>
                        <span style={styles.statLabel}>إجمالي العقودات</span>
                        <div style={{...styles.statValue, margin: '2px 0 10px 0'}}>
                          {stats.counts.totalContracts}
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px'}}>
                          <span style={{color: '#059669', fontWeight: 'bold'}}>ساري: {stats.counts.activeContracts}</span>
                          <span style={{color: '#d97706', fontWeight: 'bold'}}>منتهي: {stats.counts.expiredContracts}</span>
                          <span style={{color: '#dc2626', fontWeight: 'bold'}}>ملغي: {stats.counts.cancelledContracts}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statIconBoxBg4}>💰</div>
                      <div>
                        <span style={styles.statLabel}>إجمالي التحصيلات</span>
                        <span style={{...styles.statValue, color: '#059669'}}>{stats.financials.totalCollections.toLocaleString()} ج.س</span>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statIconBoxBg5}>👥</div>
                      <div style={{width: '100%'}}>
                        <span style={styles.statLabel}>الشركاء والجهات</span>
                        <div style={{...styles.statValue, margin: '2px 0 10px 0', fontSize: '18px'}}>
                          {stats.counts.totalInvestors + stats.counts.totalOwners} <span style={{fontSize: '12px', fontWeight: 'normal', color: '#64748b'}}>إجمالي الأطراف</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px'}}>
                          <span style={{color: '#0284c7', fontWeight: 'bold'}}>مستثمرين: {stats.counts.totalInvestors}</span>
                          <span style={{color: '#7c3aed', fontWeight: 'bold'}}>ملاك: {stats.counts.totalOwners}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statIconBoxBg6}>📍</div>
                      <div style={{width: '100%'}}>
                        <span style={styles.statLabel}>التوزيع الجغرافي</span>
                        <div style={{...styles.statValue, margin: '2px 0 10px 0', fontSize: '18px'}}>
                          {stats.counts.totalSectors + stats.counts.totalLocalities} <span style={{fontSize: '12px', fontWeight: 'normal', color: '#64748b'}}>نطاق إداري</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px'}}>
                          <span style={{color: '#0891b2', fontWeight: 'bold'}}>قطاعات: {stats.counts.totalSectors}</span>
                          <span style={{color: '#475569', fontWeight: 'bold'}}>ولايات: {stats.counts.totalLocalities}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* قسم التنبيهات (عقود وشك الانتهاء) */}
                  {stats.alerts.expiringContractsCount > 0 && (
                    <div style={styles.alertBox}>
                      <div style={styles.alertHeader}>
                        <span style={{fontSize: '20px'}}>⚠️</span>
                        <h3 style={styles.alertTitle}>تنبيه هام: يوجد ({stats.alerts.expiringContractsCount}) عقد على وشك الانتهاء خلال الـ 30 يوماً القادمة</h3>
                      </div>
                      <div style={styles.alertTableWrapper}>
                        <table style={styles.table}>
                          <thead>
                            <tr style={styles.trHeadAlert}>
                              <th style={styles.th}>رقم العقد</th>
                              <th style={styles.th}>الوحدة العقارية</th>
                              <th style={styles.th}>المستثمر</th>
                              <th style={styles.th}>تاريخ الانتهاء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.alerts.expiringContracts.map(c => (
                              <tr key={c.id} style={styles.trAlert}>
                                <td style={styles.td}><strong>{c.contractNumber}</strong></td>
                                <td style={styles.td}>{c.unitName}</td>
                                <td style={styles.td}>{c.investorName}</td>
                                <td style={{...styles.td, color: '#dc2626', fontWeight: 'bold'}}>
                                  {new Date(c.endDate).toLocaleDateString('ar-SA')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* قسم النشاطات الأخيرة (جداول احترافية) */}
                  <div style={styles.activitiesContainer}>
                    
                    <div style={styles.activityBox}>
                      <div style={styles.boxHeader}>
                        <h3 style={styles.sectionSubTitle}>📄 آخر العقود المضافة</h3>
                        <span style={styles.badgeCount}>{stats.recentActivity.recentContracts.length}</span>
                      </div>
                      {stats.recentActivity.recentContracts.length === 0 ? (
                        <p style={styles.emptyText}>لا توجد عقود مسجلة حديثاً</p>
                      ) : (
                        <div style={{overflowX: 'auto'}}>
                          <table style={styles.table}>
                            <thead>
                              <tr style={styles.trHead}>
                                <th style={styles.th}>رقم العقد</th>
                                <th style={styles.th}>بواسطة</th>
                                <th style={styles.th}>تاريخ الإضافة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.recentActivity.recentContracts.map(rc => (
                                <tr key={rc.id} style={styles.tr}>
                                  <td style={styles.td}><span style={styles.codeBadge}>{rc.contractNumber}</span></td>
                                  <td style={styles.td}>{rc.createdBy || 'مسؤول النظام'}</td>
                                  <td style={styles.td}>{new Date(rc.createdAt).toLocaleDateString('ar-SA')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div style={styles.activityBox}>
                      <div style={styles.boxHeader}>
                        <h3 style={styles.sectionSubTitle}>💰 آخر الدفعات المالية المسجلة</h3>
                        <span style={styles.badgeCountGreen}>{stats.recentActivity.recentPayments.length}</span>
                      </div>
                      {stats.recentActivity.recentPayments.length === 0 ? (
                        <p style={styles.emptyText}>لا توجد دفعات مالية مسجلة حديثاً</p>
                      ) : (
                        <div style={{overflowX: 'auto'}}>
                          <table style={styles.table}>
                            <thead>
                              <tr style={styles.trHead}>
                                <th style={styles.th}>المبلغ المدفوع</th>
                                <th style={styles.th}>بواسطة</th>
                                <th style={styles.th}>التاريخ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.recentActivity.recentPayments.map(rp => (
                                <tr key={rp.id} style={styles.tr}>
                                  <td style={styles.td}><strong style={{color: '#059669', fontSize: '14px'}}>{rp.amountPaid.toLocaleString()} ج.س</strong></td>
                                  <td style={styles.td}>{rp.createdBy || 'مسؤول النظام'}</td>
                                  <td style={styles.td}>{new Date(rp.paymentDate).toLocaleDateString('ar-SA')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div style={styles.errorContainer}>
                  <p>❌ تعذر تحميل البيانات، تأكد من اتصال الخեր (API Server).</p>
                </div>
              )}
            </div>
          } />

          {canViewConfig && (
            <Route path="/config" element={
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <div>
                    <h2 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '8px' }}>إعدادات التهيئة</h2>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>إدارة بيانات الأساس، القطاعات، والمواقع الجغرافية للنظام:</p>
                  </div>
                  <button onClick={() => navigate('/')} style={styles.backBtn}>
                    ← العودة للرئيسية
                  </button>
                </div>
                <div style={styles.grid}>
                  {configCards.map((card) => (
                    <div 
                      key={card.id} 
                      style={styles.card}
                      onClick={() => navigate(card.path)}
                    >
                      <div style={styles.cardHeaderTop}>
                        <div style={styles.iconContainer}>{card.icon}</div>
                        <span style={styles.cardArrow}>➔</span>
                      </div>
                      <span style={styles.cardTitle}>{card.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            } />
          )}

          <Route path="/contracts" element={<h2>إدارة العقودات</h2>} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/property-units/:id" element={<PropertyUnitsPage />} />
          <Route path="/reports" element={<h2>التقارير والإحصائيات المالية</h2>} />
          <Route path="/investors" element={<InvestorsPage />} />
          <Route path="/owners" element={<OwnersPage />} />
          <Route path="/sectors" element={<SectorsPage />} />
          <Route path="/localities" element={<Statespage />} />
          <Route path="/cities" element={<CitiesPage />} />
          
          {isAdmin && <Route path="/users" element={<UsersPage />} />}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

const styles = {
  dashboardContainer: { minHeight: '100vh', backgroundColor: '#f4f6f9', direction: 'rtl', fontFamily: 'Cairo, sans-serif' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', color: '#fff', padding: '0 30px', height: '70px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandIcon: { fontSize: '24px' },
  brandTitle: { fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '0.5px' },
  navLinks: { display: 'flex', gap: '5px', alignItems: 'center', height: '100%' },
  navLinkBtn: { 
    background: 'transparent', 
    backgroundColor: 'transparent', 
    border: 'none', 
    borderBottom: '3px solid transparent', 
    color: '#cbd5e1', 
    fontSize: '14px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    padding: '0 15px', 
    height: '100%', 
    transition: 'color 0.2s' 
  },
  activeLink: { 
    color: '#ffffff', 
    borderBottom: '3px solid #38bdf8', 
    backgroundColor: 'transparent',
    background: 'transparent'
  },
  dropdownItemActive: { backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#0284c7' },
  dropdownContainer: { position: 'relative', height: '100%', display: 'flex', alignItems: 'center' },
  dropdownMenu: { position: 'absolute', top: '70px', right: '0', backgroundColor: '#ffffff', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '8px', width: '180px', overflow: 'hidden', zIndex: 100, border: '1px solid #e2e8f0' },
  dropdownItem: { padding: '12px 16px', fontSize: '16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: '500' },
  userSection: { position: 'relative' },
  userDropdownContainer: { position: 'relative' },
  userToggleBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 14px', borderRadius: '30px' },
  userAvatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' },
  userMenu: { position: 'absolute', top: '45px', left: '0', backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '8px', width: '160px', overflow: 'hidden', zIndex: 100, border: '1px solid #e2e8f0' },
  logoutBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#dc2626', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' },
  
  mainContent: { padding: '30px 40px', color: '#1e293b', maxWidth: '1400px', margin: '0 auto' },
  
  welcomeBanner: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  welcomeTitle: { fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' },
  welcomeSubtitle: { color: '#64748b', fontSize: '16px' },
  systemBadge: { backgroundColor: '#f0f9ff', color: '#0284c7', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #bae6fd' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' },
  pageSubtitle: { color: '#64748b', fontSize: '16px' },
  refreshBtn: { padding: '10px 18px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', boxShadow: '0 2px 4px rgba(2,132,199,0.2)', transition: 'background 0.2s' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column' },
  cardHeaderTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  iconContainer: { fontSize: '32px', backgroundColor: '#f8fafc', width: '55px', height: '55px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9' },
  cardArrow: { color: '#94a3b8', fontSize: '16px', fontWeight: 'bold' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' },
  cardDesc: { fontSize: '16px', color: '#64748b', lineHeight: '1.4' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '18px' },
  
  statIconBoxBg1: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
  statIconBoxBg2: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
  statIconBoxBg3: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
  statIconBoxBg4: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
  statIconBoxBg5: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },
  statIconBoxBg6: { width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 },

  statLabel: { fontSize: '16px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' },
  statValue: { fontSize: '22px', fontWeight: '800', color: '#0f172a' },
  statValueRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  
  subStats: { display: 'flex', gap: '6px', marginTop: '8px', fontSize: '16px', flexWrap: 'wrap' },
  subStatsSimple: { fontSize: '16px', marginTop: '6px', color: '#64748b' },
  
  badgeGreen: { backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' },
  badgeOrange: { backgroundColor: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' },
  badgeRed: { backgroundColor: '#fef2f2', color: '#b91c1c', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' },

  alertBox: { backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '20px 24px', borderRadius: '16px', marginBottom: '30px' },
  alertHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  alertTitle: { color: '#9f1239', fontSize: '16px', fontWeight: '700', margin: 0 },
  alertTableWrapper: { backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #ffe4e6' },
  trHeadAlert: { backgroundColor: '#fff1f2', borderBottom: '1px solid #fecdd3' },
  trAlert: { borderBottom: '1px solid #ffe4e6' },

  activitiesContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' },
  activityBox: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  boxHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  sectionSubTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 },
  badgeCount: { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 10px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold' },
  badgeCountGreen: { backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 10px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold' },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right' },
  trHead: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '12px 14px', fontSize: '16px', color: '#475569', fontWeight: '700' },
  td: { padding: '12px 14px', fontSize: '16px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
  tr: { transition: 'background 0.1s' },
  codeBadge: { backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#0f172a' },
  
  emptyText: { color: '#94a3b8', fontSize: '16px', textAlign: 'center', padding: '30px 0' },
  loadingContainer: { textAlign: 'center', padding: '80px 0' },
  spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' },
  errorContainer: { textAlign: 'center', padding: '60px', color: '#dc2626', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #fca5a5' },
  backBtn: { padding: '10px 18px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }
};