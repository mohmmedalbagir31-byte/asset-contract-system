import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api'; // استيراد ملف الـ API المركزي

export default function ContractPaymentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [financialData, setFinancialData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- حالات الترقيم (Pagination States) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // حالات فتح وغلق الأقسام (Accordion States)
  const [openSections, setOpenSections] = useState({
    contract: true,
    unit: true,
    owner: false,
    investor: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // حالة إظهار قائمة خيارات الطباعة
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const printMenuRef = useRef(null);

  // إغلاق قائمة الطباعة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target)) {
        setShowPrintMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPayment, setCurrentPayment] = useState({
    id: null,
    contractId: id,
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: 'دفعة شهرية',
    paymentMethod: '',
    referenceNumber: '',
    notes: '',
    createdBy: localStorage.getItem('username') || 'مسؤول النظام'
  });

  const fetchFinancialSummary = async () => {
    setIsLoading(true);
    try {
      // استخدام ملف الـ API المركزي بدلاً من axios المباشر
      const response = await API.get(`/contractpayment/contract/${id}`);
      setFinancialData(response.data);
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول.');
      } else {
        setError(err.response?.data?.message || err.message || 'فشل في جلب البيانات المالية للعقد');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFinancialSummary();
    }
  }, [id]);

  const handleOpenAddModal = () => {
    setCurrentPayment({
      id: null,
      contractId: Number(id),
      amountPaid: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentType: 'دفعة شهرية',
      paymentMethod: '',
      referenceNumber: '',
      notes: '',
      createdBy: localStorage.getItem('username') || 'مسؤول النظام'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (payment) => {
    setCurrentPayment({
      id: payment.id,
      contractId: Number(id),
      amountPaid: payment.amountPaid,
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
      paymentType: payment.paymentType || 'دفعة شهرية',
      paymentMethod: payment.paymentMethod || '',
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || '',
      createdBy: payment.createdBy || (localStorage.getItem('username') || 'مسؤول النظام')
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        contractId: Number(id),
        amountPaid: Number(currentPayment.amountPaid),
        paymentDate: currentPayment.paymentDate ? new Date(currentPayment.paymentDate).toISOString() : new Date().toISOString(),
        paymentType: currentPayment.paymentType,
        paymentMethod: currentPayment.paymentMethod,
        referenceNumber: currentPayment.referenceNumber,
        notes: currentPayment.notes,
        createdBy: currentPayment.createdBy
      };

      if (isEditing) {
        await API.put(`/contractpayment/${currentPayment.id}`, { ...payload, id: currentPayment.id });
      } else {
        await API.post('/contractpayment', payload);
      }

      setShowModal(false);
      fetchFinancialSummary();
    } catch (err) {
      const serverMsg = err.response?.data?.message || JSON.stringify(err.response?.data) || err.message;
      alert(`فشل حفظ الدفعة: ${serverMsg}`);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    try {
      await API.delete(`/contractpayment/${paymentId}`);
      fetchFinancialSummary();
    } catch (err) {
      alert('فشل في حذف الدفعة');
    }
  };

  // دالة تنفيذ الطباعة حسب النوع المختار
  const handlePrint = (type) => {
    setShowPrintMenu(false);
    document.body.className = `print-mode-${type}`;
    setTimeout(() => {
      window.print();
      document.body.className = '';
    }, 150);
  };

  const isFullyPaid = financialData ? financialData.totalPaid >= financialData.totalContractValue : false;

  // --- حساب عناصر الترقيم (Pagination Logic) ---
  const paymentsList = financialData?.paymentsList || [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = paymentsList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(paymentsList.length / itemsPerPage);

  
  return (
    <div style={styles.pageWrapper}>
      
      {/* ناف بار */}
      <nav style={styles.navbar} className="no-print">
        <div style={styles.navBrand}>
          <span style={styles.navLogoIcon}>💰</span>
          <span style={styles.navTitle}>إدارة الدفعات والتحصيل المالي</span>
        </div>
        <div style={styles.navActions}>
          
          {/* زر الطباعة مع القائمة المنسدلة */}
          <div style={styles.printDropdownContainer} ref={printMenuRef}>
            <button onClick={() => setShowPrintMenu(!showPrintMenu)} style={styles.printMainBtn}>
              🖨️ طباعة التقارير ▼
            </button>
            {showPrintMenu && (
              <div style={styles.printMenuDropdown}>
                <button onClick={() => handlePrint('details')} style={styles.printOptionBtn}>
                  📋 طباعة تفاصيل العقد والأطراف فقط
                </button>
                <button onClick={() => handlePrint('payments')} style={styles.printOptionBtn}>
                  💰 طباعة الدفعات المالية فقط
                </button>
                <button onClick={() => handlePrint('both')} style={styles.printOptionBtn}>
                  📊 طباعة التفاصيل والدفعات معاً
                </button>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/contracts')} style={styles.navBackBtn}>⬅ العودة للعقود</button>
        </div>
      </nav>

      <div style={styles.container} className="no-print">
        {isLoading && <p style={styles.infoText}>جاري تحميل البيانات المالية...</p>}
        {error && <div style={styles.errorBox}><span>خطأ: {error}</span></div>}

        {financialData && (
          <div style={styles.mainLayoutGrid}>
            
            {/* القسم الأيمن (70%): الجدول والإحصائيات والترقيم */}
            <div style={styles.rightSection}>
              <div style={styles.headerRow}>
                <div>
                  <h2 style={styles.sectionTitle}>حركات الدفع والسداد للعقد</h2>
                  <p style={styles.sectionSubtitle}>متابعة كافة الدفعات المالية المسجلة وتاريخ السداد</p>
                </div>
                
                <button 
                  onClick={handleOpenAddModal} 
                  style={{ ...styles.addBtn, ...(isFullyPaid ? styles.disabledBtn : {}) }}
                  disabled={isFullyPaid}
                >
                  {isFullyPaid ? '✔ العقد مسدد بالكامل' : '+ تسجيل دفعة جديدة'}
                </button>
              </div>

              {/* بطاقات الإحصائيات */}
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderRight: '4px solid #0ea5e9' }}>
                  <p style={styles.statTitle}>إجمالي العقد (بالعمولة)</p>
                  <p style={styles.statValue}>{financialData.totalContractValue?.toLocaleString()} ج.س</p>
                </div>
                <div style={{ ...styles.statCard, borderRight: '4px solid #10b981' }}>
                  <p style={styles.statTitle}>إجمالي المبالغ المدفوعة</p>
                  <p style={{ ...styles.statValue, color: '#059669' }}>{financialData.totalPaid?.toLocaleString()} ج.س</p>
                </div>
                <div style={{ ...styles.statCard, borderRight: '4px solid #f59e0b' }}>
                  <p style={styles.statTitle}>المبلغ المتبقي</p>
                  <p style={{ ...styles.statValue, color: '#d97706' }}>{financialData.remainingAmount?.toLocaleString()} ج.س</p>
                </div>
                <div style={{ ...styles.statCard, borderRight: '4px solid #6366f1' }}>
                  <p style={styles.statTitle}>حالة السداد الشاملة</p>
                  <p style={{ ...styles.statValue, marginTop: '5px' }}>
                    <span style={isFullyPaid ? styles.badgePaid : styles.badgePartial}>{financialData.paymentStatus}</span>
                  </p>
                </div>
              </div>

              {/* جدول الدفعيات */}
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={{ ...styles.th, width: '12%' }}>المبلغ</th>
                      <th style={{ ...styles.th, width: '12%' }}>التاريخ</th>
                      <th style={{ ...styles.th, width: '13%' }}>النوع</th>
                      <th style={{ ...styles.th, width: '13%' }}>طريقة الدفع</th>
                      <th style={{ ...styles.th, width: '12%' }}>رقم الإيصال</th>
                      <th style={{ ...styles.th, width: '18%' }}>الملاحظات</th>
                      <th style={{ ...styles.th, width: '10%' }}>الموظف</th>
                      <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayments.length > 0 ? (
                      currentPayments.map((p) => (
                        <tr key={p.id} style={styles.tableRow}>
                          <td style={{ ...styles.td, fontWeight: 'bold', color: '#059669' }}>{p.amountPaid?.toLocaleString()} ج.س</td>
                          <td style={styles.td}>{p.paymentDate ? p.paymentDate.split('T')[0] : ''}</td>
                          <td style={styles.td}>{p.paymentType}</td>
                          <td style={styles.td}>{p.paymentMethod}</td>
                          <td style={styles.td}>{p.referenceNumber || '---'}</td>
                          <td style={styles.tdNotes}>{p.notes || '---'}</td>
                          <td style={styles.td}>{p.createdBy || '---'}</td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <div style={styles.actionsContainer}>
                              <button onClick={() => handleOpenEditModal(p)} style={styles.editBtn}>تعديل</button>
                              <button onClick={() => handleDeletePayment(p.id)} style={styles.deleteBtn}>حذف</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8" style={styles.noData}>لا توجد دفعات مسجلة لهذا العقد حتى الآن</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* --- شريط الترقيم (Pagination Controls) --- */}
              {paymentsList.length > 0 && (
                <div style={styles.paginationContainer}>
                  <div style={styles.paginationInfo}>
                    عرض الصفحة {currentPage} من {totalPages || 1} (إجمالي الدفعات: {paymentsList.length})
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

            </div>

            {/* القسم الأيسر (30%): الأقسام القابلة للطي (Accordion) */}
            <div style={styles.leftSection}>
              
              {/* 1. تفاصيل العقد الأساسية */}
              <div style={styles.accordionCard}>
                <div style={styles.accordionHeader} onClick={() => toggleSection('contract')}>
                  <h3 style={styles.accordionTitle}>📋 تفاصيل العقد الأساسية</h3>
                  <span>{openSections.contract ? '▲' : '▼'}</span>
                </div>
                {openSections.contract && (
                  <div style={styles.accordionBody}>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>رقم العقد:</span><span style={styles.detailValueBold}>{financialData.contractNumber}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>نوع العقد:</span><span style={styles.detailValue}>{financialData.contractType}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>مدة العقد:</span><span style={styles.detailValue}>{financialData.duration}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>القيمة الأساسية:</span><span style={styles.detailValue}>{financialData.contractValue?.toLocaleString()} ج.س</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>قيمة العمولة:</span><span style={styles.detailValue}>{financialData.annex?.toLocaleString()} ج.س</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>الإيجار الشهري:</span><span style={styles.detailValue}>{financialData.monthlyRentValue?.toLocaleString()} ج.س</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>الإجمالي:</span><span style={{...styles.detailValue, fontWeight:'bold', color:'#0ea5e9'}}>{financialData.totalContractValue?.toLocaleString()} ج.س</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>البداية:</span><span style={styles.detailValue}>{financialData.startDate?.split('T')[0]}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>النهاية:</span><span style={styles.detailValue}>{financialData.endDate?.split('T')[0]}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>الحالة:</span><span style={styles.detailValue}>{financialData.status}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>مدينة التوقيع:</span><span style={styles.detailValue}>{financialData.contractCityName || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>المسؤول:</span><span style={styles.detailValue}>{financialData.createdBy || '---'}</span></div>
                  </div>
                )}
              </div>

              {/* 2. بيانات الوحدة والعقار */}
              <div style={styles.accordionCard}>
                <div style={styles.accordionHeader} onClick={() => toggleSection('unit')}>
                  <h3 style={styles.accordionTitle}>🏠 بيانات الوحدة والعقار</h3>
                  <span>{openSections.unit ? '▲' : '▼'}</span>
                </div>
                {openSections.unit && (
                  <div style={styles.accordionBody}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>رقم الوحدة:</span>
                      <span style={styles.clickableLink} onClick={() => navigate(`/units/${financialData.unitId}`)}>{financialData.unitNumber} 🔗</span>
                    </div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>النشاط:</span><span style={styles.detailValue}>{financialData.activityType}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>المساحة:</span><span style={styles.detailValue}>{financialData.areaSize} م²</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>حالة الوحدة:</span><span style={styles.detailValue}>{financialData.unitStatus}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>العقار الأم:</span><span style={styles.detailValue}>{financialData.propertyName || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>كود العقار:</span><span style={styles.detailValue}>{financialData.propertyCode || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>القطاع:</span><span style={styles.detailValue}>{financialData.propertySectorName || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>الولاية:</span><span style={styles.detailValue}>{financialData.propertyStateName || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>مدينة العقار:</span><span style={styles.detailValue}>{financialData.propertyCityName || '---'}</span></div>
                  </div>
                )}
              </div>

              {/* 3. بيانات المالك */}
              <div style={styles.accordionCard}>
                <div style={styles.accordionHeader} onClick={() => toggleSection('owner')}>
                  <h3 style={styles.accordionTitle}>🏢 بيانات المالك</h3>
                  <span>{openSections.owner ? '▲' : '▼'}</span>
                </div>
                {openSections.owner && (
                  <div style={styles.accordionBody}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>المالك:</span>
                      <span style={styles.clickableLink} onClick={() => navigate(`/owners/${financialData.ownerId}`)}>{financialData.ownerName} 🔗</span>
                    </div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>الهاتف:</span><span style={styles.detailValue}>{financialData.ownerPhone || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>البريد:</span><span style={styles.detailValue}>{financialData.ownerEmail || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>العنوان:</span><span style={styles.detailValue}>{financialData.ownerAddress || '---'}</span></div>
                  </div>
                )}
              </div>

              {/* 4. بيانات المستثمر */}
              <div style={styles.accordionCard}>
                <div style={styles.accordionHeader} onClick={() => toggleSection('investor')}>
                  <h3 style={styles.accordionTitle}>👤 بيانات المستثمر</h3>
                  <span>{openSections.investor ? '▲' : '▼'}</span>
                </div>
                {openSections.investor && (
                  <div style={styles.accordionBody}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>المستثمر:</span>
                      <span style={styles.clickableLink} onClick={() => navigate(`/investors/${financialData.investorId}`)}>{financialData.investorName} 🔗</span>
                    </div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>الهاتف:</span><span style={styles.detailValue}>{financialData.investorPhone || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>البريد:</span><span style={styles.detailValue}>{financialData.investorEmail || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>العنوان:</span><span style={styles.detailValue}>{financialData.investorAddress || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>رقم الهوية:</span><span style={styles.detailValue}>{financialData.investorIdType}: {financialData.investorIdNumber || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>تاريخ الإصدار:</span><span style={styles.detailValue}>{financialData.investorIssueDate?.split('T')[0] || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>تاريخ الانتهاء:</span><span style={styles.detailValue}>{financialData.investorExpiryDate?.split('T')[0] || '---'}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailLabel}>مكان الإصدار:</span><span style={styles.detailValue}>{financialData.investorIssuePlace || '---'}</span></div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Modal إضافة أو تعديل دفعة */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>{isEditing ? 'تعديل بيانات الدفعة' : 'تسجيل دفعة مالية جديدة'}</h3>
              <form onSubmit={handleSavePayment} style={styles.formGrid}>
                <div style={styles.inputGroup}><label style={styles.label}>المبلغ المدفوع *</label><input type="number" step="0.01" required value={currentPayment.amountPaid} onChange={(e) => setCurrentPayment({ ...currentPayment, amountPaid: e.target.value })} style={styles.input} /></div>
                <div style={styles.inputGroup}><label style={styles.label}>تاريخ السداد *</label><input type="date" required value={currentPayment.paymentDate} onChange={(e) => setCurrentPayment({ ...currentPayment, paymentDate: e.target.value })} style={styles.input} onClick={(e) => e.target.showPicker && e.target.showPicker()} /></div>
                <div style={styles.inputGroup}><label style={styles.label}>نوع الدفعة *</label><select required value={currentPayment.paymentType} onChange={(e) => setCurrentPayment({ ...currentPayment, paymentType: e.target.value })} style={styles.input}><option value="دفعة شهرية">دفعة شهرية</option><option value="دفعة مقدمة">دفعة مقدمة</option><option value="عمولة">عمولة</option><option value="رسوم صيانة">رسوم صيانة</option><option value="أخرى">أخرى</option></select></div>
                <div style={styles.inputGroup}><label style={styles.label}>طريقة الدفع *</label><input type="text" required value={currentPayment.paymentMethod} onChange={(e) => setCurrentPayment({ ...currentPayment, paymentMethod: e.target.value })} style={styles.input} /></div>
                <div style={styles.inputGroup}><label style={styles.label}>رقم الإيصال</label><input type="text" value={currentPayment.referenceNumber} onChange={(e) => setCurrentPayment({ ...currentPayment, referenceNumber: e.target.value })} style={styles.input} /></div>
                <div style={styles.inputGroup}><label style={styles.label}>الموظف *</label><input type="text" required value={currentPayment.createdBy} onChange={(e) => setCurrentPayment({ ...currentPayment, createdBy: e.target.value })} style={styles.input} /></div>
                <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}><label style={styles.label}>ملاحظات</label><textarea rows="2" value={currentPayment.notes} onChange={(e) => setCurrentPayment({ ...currentPayment, notes: e.target.value })} style={styles.input} /></div>
                <div style={{ ...styles.modalActions, gridColumn: 'span 2' }}><button type="submit" style={styles.saveBtn}>حفظ</button><button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>إلغاء</button></div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ======================= قسم الطباعة الرسمي والمستقل (Print Area) ======================= */}
      {financialData && (
        <div id="printable-area" className="print-only">
          <div style={styles.printHeader}>
            <h1 style={styles.printTitle}>تقرير إدارة الأصول والعقود</h1>
            <p style={styles.printSubtitle}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          {/* محتوى طباعة التفاصيل مقسماً تماماً كالـ Accordion */}
          <div className="print-section-details">
            
            {/* 1. تفاصيل العقد الأساسية */}
            <div style={styles.printBox}>
              <h3 style={styles.printBoxTitle}>📋 تفاصيل العقد الأساسية</h3>
              <table style={styles.printTable}>
                <tbody>
                  <tr><td><strong>رقم العقد:</strong> {financialData.contractNumber}</td><td><strong>نوع العقد:</strong> {financialData.contractType}</td></tr>
                  <tr><td><strong>مدة العقد:</strong> {financialData.duration}</td><td><strong>الحالة:</strong> {financialData.status}</td></tr>
                  <tr><td><strong>القيمة الأساسية:</strong> {financialData.contractValue?.toLocaleString()} ج.س</td><td><strong>قيمة العمولة:</strong> {financialData.annex?.toLocaleString()} ج.س</td></tr>
                  <tr><td><strong>الإيجار الشهري:</strong> {financialData.monthlyRentValue?.toLocaleString()} ج.س</td><td><strong>الإجمالي:</strong> {financialData.totalContractValue?.toLocaleString()} ج.س</td></tr>
                  <tr><td><strong>تاريخ البداية:</strong> {financialData.startDate?.split('T')[0]}</td><td><strong>تاريخ النهاية:</strong> {financialData.endDate?.split('T')[0]}</td></tr>
                  <tr><td><strong>مدينة التوقيع:</strong> {financialData.contractCityName || '---'}</td><td><strong>المسؤول:</strong> {financialData.createdBy || '---'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* 2. بيانات الوحدة والعقار */}
            <div style={styles.printBox}>
              <h3 style={styles.printBoxTitle}>🏠 بيانات الوحدة والعقار</h3>
              <table style={styles.printTable}>
                <tbody>
                  <tr><td><strong>رقم الوحدة:</strong> {financialData.unitNumber}</td><td><strong>النشاط:</strong> {financialData.activityType}</td></tr>
                  <tr><td><strong>المساحة:</strong> {financialData.areaSize} م²</td><td><strong>حالة الوحدة:</strong> {financialData.unitStatus}</td></tr>
                  <tr><td><strong>العقار الأم:</strong> {financialData.propertyName || '---'}</td><td><strong>كود العقار:</strong> {financialData.propertyCode || '---'}</td></tr>
                  <tr><td><strong>القطاع:</strong> {financialData.propertySectorName || '---'}</td><td><strong>الولاية/المدينة:</strong> {financialData.propertyStateName || '---'} / {financialData.propertyCityName || '---'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* 3. بيانات المالك */}
            <div style={styles.printBox}>
              <h3 style={styles.printBoxTitle}>🏢 بيانات المالك</h3>
              <table style={styles.printTable}>
                <tbody>
                  <tr><td><strong>المالك:</strong> {financialData.ownerName}</td><td><strong>الهاتف:</strong> {financialData.ownerPhone || '---'}</td></tr>
                  <tr><td><strong>البريد:</strong> {financialData.ownerEmail || '---'}</td><td><strong>العنوان:</strong> {financialData.ownerAddress || '---'}</td></tr>
                </tbody>
              </table>
            </div>

            {/* 4. بيانات المستثمر */}
            <div style={styles.printBox}>
              <h3 style={styles.printBoxTitle}>👤 بيانات المستثمر</h3>
              <table style={styles.printTable}>
                <tbody>
                  <tr><td><strong>المستثمر:</strong> {financialData.investorName}</td><td><strong>الهاتف:</strong> {financialData.investorPhone || '---'}</td></tr>
                  <tr><td><strong>البريد:</strong> {financialData.investorEmail || '---'}</td><td><strong>العنوان:</strong> {financialData.investorAddress || '---'}</td></tr>
                  <tr><td><strong>رقم الهوية:</strong> {financialData.investorIdType}: {financialData.investorIdNumber || '---'}</td><td><strong>مكان وتاريخ الإصدار:</strong> {financialData.investorIssuePlace || '---'} ({financialData.investorIssueDate?.split('T')[0] || '---'})</td></tr>
                  <tr><td><strong>تاريخ الانتهاء:</strong> {financialData.investorExpiryDate?.split('T')[0] || '---'}</td><td></td></tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* محتوى طباعة الدفعيات */}
          <div className="print-section-payments">
            <h3 style={styles.printSectionTitle}>💰 جدول الدفعات والتحصيل المالي</h3>
            <div style={styles.printStatsBox}>
              <span><strong>إجمالي العقد:</strong> {financialData.totalContractValue?.toLocaleString()} ج.س</span>
              <span><strong>المدفوع:</strong> {financialData.totalPaid?.toLocaleString()} ج.س</span>
              <span><strong>المتبقي:</strong> {financialData.remainingAmount?.toLocaleString()} ج.س</span>
              <span><strong>الحالة:</strong> {financialData.paymentStatus}</span>
            </div>
            <table style={styles.printTableData}>
              <thead>
                <tr style={{backgroundColor: '#e2e8f0'}}>
                  <th style={styles.printTh}>المبلغ</th>
                  <th style={styles.printTh}>التاريخ</th>
                  <th style={styles.printTh}>النوع</th>
                  <th style={styles.printTh}>طريقة الدفع</th>
                  <th style={styles.printTh}>رقم الإيصال</th>
                  <th style={styles.printTh}>الملاحظات</th>
                  <th style={styles.printTh}>الموظف</th>
                </tr>
              </thead>
              <tbody>
                {paymentsList.length > 0 ? (
                  paymentsList.map((p, idx) => (
                    <tr key={idx}>
                      <td style={styles.printTd}>{p.amountPaid?.toLocaleString()} ج.س</td>
                      <td style={styles.printTd}>{p.paymentDate?.split('T')[0]}</td>
                      <td style={styles.printTd}>{p.paymentType}</td>
                      <td style={styles.printTd}>{p.paymentMethod}</td>
                      <td style={styles.printTd}>{p.referenceNumber || '---'}</td>
                      <td style={styles.printTd}>{p.notes || '---'}</td>
                      <td style={styles.printTd}>{p.createdBy}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={styles.printTdCenter}>لا توجد دفعات مسجلة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ستايلات التحكم بالطباعة والترقيم عبر CSS */}
      <style>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; font-family: Tahoma, sans-serif !important; font-size: 13px !important; color: #000 !important; }
          
          body:not(.print-mode-details):not(.print-mode-both) .print-section-details { display: none !important; }
          body:not(.print-mode-payments):not(.print-mode-both) .print-section-payments { display: none !important; }
          
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Tahoma, sans-serif', fontSize: '16px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  navBrand: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLogoIcon: { fontSize: '22px' },
  navTitle: { fontSize: '16px', fontWeight: 'bold', color: '#0f172a' },
  navActions: { display: 'flex', alignItems: 'center', gap: '15px' },
  
  printDropdownContainer: { position: 'relative', display: 'inline-block' },
  printMainBtn: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  printMenuDropdown: { position: 'absolute', left: 0, top: '100%', marginTop: '5px', backgroundColor: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid #e2e8f0', zIndex: 1000, display: 'flex', flexDirection: 'column', width: '280px' },
  printOptionBtn: { background: 'none', border: 'none', padding: '12px 15px', textAlign: 'right', fontSize: '16px', color: '#334155', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' },

  navBackBtn: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  container: { padding: '20px 30px', width: '100%', boxSizing: 'border-box' },
  mainLayoutGrid: { display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '25px', alignItems: 'start' },
  rightSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  leftSection: { display: 'flex', flexDirection: 'column', gap: '15px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  sectionTitle: { fontSize: '18px', color: '#0f172a', fontWeight: 'bold', margin: 0 },
  sectionSubtitle: { fontSize: '16px', color: '#64748b', marginTop: '4px' },
  addBtn: { backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  disabledBtn: { backgroundColor: '#cbd5e1', color: '#64748b', cursor: 'not-allowed', border: '1px solid #94a3b8' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  statCard: { backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' },
  statTitle: { fontSize: '16px', color: '#64748b', margin: '0 0 6px 0' },
  statValue: { fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', overflow: 'hidden', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'right', tableLayout: 'fixed' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '12px 10px', fontSize: '16px', fontWeight: '700', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 10px', fontSize: '16px', color: '#1e293b', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tdNotes: { padding: '12px 10px', fontSize: '16px', color: '#64748b', fontStyle: 'italic', verticalAlign: 'middle', wordBreak: 'break-word', whiteSpace: 'normal', maxHeight: '80px', overflowY: 'auto' },
  actionsContainer: { display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' },
  noData: { textAlign: 'center', padding: '25px', color: '#64748b', fontSize: '16px' },
  
  // --- ستايلات نظام الترقيم (Pagination Styles) ---
  paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', marginTop: '10px' },
  paginationInfo: { fontSize: '14px', color: '#64748b', fontWeight: '600' },
  paginationControls: { display: 'flex', gap: '10px', alignItems: 'center' },
  pageSizeSelect: { padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', fontSize: '14px', color: '#334155', outline: 'none', cursor: 'pointer' },
  pageBtn: { padding: '6px 14px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  pageBtnDisabled: { backgroundColor: '#cbd5e1', color: '#64748b', cursor: 'not-allowed' },

  accordionCard: { backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', overflow: 'hidden' },
  accordionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f8fafc', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' },
  accordionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 },
  accordionBody: { padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '10px' },

  detailItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px' },
  detailLabel: { color: '#64748b', fontWeight: '600', fontSize: '16px' },
  detailValue: { color: '#1e293b', textAlign: 'left', maxWidth: '60%', wordBreak: 'break-word', fontSize: '16px' },
  detailValueBold: { color: '#0ea5e9', fontWeight: 'bold', fontSize: '16px' },
  clickableLink: { color: '#0284c7', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' },
  badgePaid: { backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '15px', fontSize: '16px', fontWeight: '600' },
  badgePartial: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '15px', fontSize: '16px', fontWeight: '600' },
  editBtn: { backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '15px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '16px', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' },
  saveBtn: { backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  infoText: { color: '#64748b', fontSize: '16px', textAlign: 'center', padding: '40px' },
  errorBox: { backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 20px', borderRadius: '6px', marginBottom: '15px', fontSize: '16px' },

  // ستايلات قسم الطباعة المخصص والمقسم
  printHeader: { textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '8px' },
  printTitle: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 3px 0' },
  printSubtitle: { fontSize: '11px', color: '#555', margin: 0 },
  printSectionTitle: { fontSize: '14px', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: '6px 10px', borderRight: '4px solid #0ea5e9', margin: '15px 0 8px 0' },
  
  printBox: { border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '10px', padding: '8px 10px', backgroundColor: '#fff' },
  printBoxTitle: { fontSize: '13px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 6px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' },
  
  printTable: { width: '100%', borderCollapse: 'collapse', fontSize: '11px' },
  printTableData: { width: '100%', borderCollapse: 'collapse', marginTop: '5px', fontSize: '11px' },
  printTh: { border: '1px solid #cbd5e1', padding: '6px', backgroundColor: '#f8fafc', textAlign: 'right' },
  printTd: { border: '1px solid #cbd5e1', padding: '6px', textAlign: 'right' },
  printTdCenter: { border: '1px solid #cbd5e1', padding: '15px', textAlign: 'center', color: '#64748b' },
  printStatsBox: { display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontSize: '12px', marginBottom: '8px' }
};