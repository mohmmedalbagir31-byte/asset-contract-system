using AssetContractSystem.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetContractSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var today = DateTime.UtcNow.Date;
            var thirtyDaysLater = today.AddDays(30);

            // 1. المؤشرات الإجمالية (Counts)
            var totalProperties = await _context.Properties.CountAsync();
            
            var totalUnits = await _context.PropertyUnits.CountAsync();
            var rentedUnits = await _context.PropertyUnits.CountAsync(u => u.Status == "مؤجرة");
            var vacantUnits = await _context.PropertyUnits.CountAsync(u => u.Status == "شاغر");
            var maintenanceUnits = await _context.PropertyUnits.CountAsync(u => u.Status == "صيانة");

            var totalContracts = await _context.Contracts.CountAsync();
            var activeContracts = await _context.Contracts.CountAsync(c => c.Status == "ساري");
            var expiredContracts = await _context.Contracts.CountAsync(c => c.Status == "منتهي");
            var cancelledContracts = await _context.Contracts.CountAsync(c => c.Status == "ملغي");

            var totalInvestors = await _context.Investors.CountAsync();
            var totalOwners = await _context.Owners.CountAsync();

            var totalSectors = await _context.Sectors.CountAsync();
            var totalLocalities = await _context.States.CountAsync(); // أو Localities حسب جدولك
            var totalCities = await _context.Cities.CountAsync();

            // 2. الماليات (Financials)
            var totalCollections = await _context.ContractPayments.SumAsync(p => (decimal?)p.AmountPaid) ?? 0;
            // ملاحظة: إذا كان لديك حقل للمستحقات أو المتأخرات يمكن حسابه هنا، حالياً سنضعه كمثال أو نربطه بالمنطق الخاص بك
            var totalArrears = 0; // يمكنك تحديثه لاحقاً حسب جدول الدفعات المستحقة

            // 3. التنبيهات: العقود التي ستنتهي خلال 30 يوماً
            var expiringContracts = await _context.Contracts
                .Include(c => c.PropertyUnit)
                .Include(c => c.Investor)
                .Where(c => c.Status == "ساري" && c.EndDate >= today && c.EndDate <= thirtyDaysLater)
                .Select(c => new
                {
                    c.Id,
                    c.ContractNumber,
                    c.EndDate,
                    InvestorName = c.Investor != null ? c.Investor.Name : "غير معروف",
                    UnitName = c.PropertyUnit != null ? c.PropertyUnit.UnitNumber : "غير معروف"
                })
                .ToListAsync();

            // 4. النشاطات الأخيرة (آخر 5 عقود مضافة)
            var recentContracts = await _context.Contracts
                .OrderByDescending(c => c.CreatedAt)
                .Take(5)
                .Select(c => new
                {
                    c.Id,
                    c.ContractNumber,
                    c.CreatedAt,
                    c.CreatedBy,
                    Type = "عقد جديد"
                })
                .ToListAsync();

            // آخر 5 دفعات مالية مسجلة
            var recentPayments = await _context.ContractPayments
                .OrderByDescending(p => p.Id)
                .Take(5)
                .Select(p => new
                {
                    p.Id,
                    p.AmountPaid,
                    p.PaymentDate,
                    p.CreatedBy,
                    Type = "دفعة مالية"
                })
                .ToListAsync();

            return Ok(new
            {
                counts = new
                {
                    totalProperties,
                    totalUnits,
                    rentedUnits,
                    vacantUnits,
                    maintenanceUnits,
                    totalContracts,
                    activeContracts,
                    expiredContracts,
                    cancelledContracts,
                    totalInvestors,
                    totalOwners,
                    totalSectors,
                    totalLocalities,
                    totalCities
                },
                financials = new
                {
                    totalCollections,
                    totalArrears
                },
                alerts = new
                {
                    expiringContractsCount = expiringContracts.Count,
                    expiringContracts
                },
                recentActivity = new
                {
                    recentContracts,
                    recentPayments
                }
            });
        }
    }
}