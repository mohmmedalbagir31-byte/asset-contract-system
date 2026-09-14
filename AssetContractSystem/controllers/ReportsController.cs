using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AssetContractSystem.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AssetContractSystem.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetReportStats()
        {
            try
            {
                // 1. إجمالي العقارات
                int totalProperties = await _context.Properties.CountAsync();

                // 2. إجمالي العقود
                int totalContracts = await _context.Contracts.CountAsync();

                // 3. العقود السارية (تأكد من قيمة الحالة في قاعدة البيانات لديك)
                int activeContracts = await _context.Contracts
                    .Where(c => c.Status == "Active" || c.Status == "ساري" || c.Status == "سارية")
                    .CountAsync();

                // 4. عقود قريبة الانتهاء (خلال الـ 30 يوماً القادمة)
                var thirtyDaysFromNow = DateTime.Now.AddDays(30);
                int expiringContracts = await _context.Contracts
                    .Where(c => c.EndDate <= thirtyDaysFromNow && c.EndDate >= DateTime.Now)
                    .CountAsync();

                var stats = new
                {
                    TotalProperties = totalProperties,
                    TotalContracts = totalContracts,
                    ActiveContracts = activeContracts,
                    ExpiringContracts = expiringContracts
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء جلب إحصائيات التقارير", error = ex.Message });
            }
        }
        [HttpGet("data")]
        public async Task<IActionResult> GetReportData([FromQuery] string type, [FromQuery] string status)
        {
            try
            {
                if (type == "contracts")
                {
                    // (الكود القديم للعقود يبقى كما هو...)
                    var query = _context.Contracts
                        .Include(c => c.Investor)
                        .Include(c => c.PropertyUnit)
                        .Include(c => c.City)
                        .AsQueryable();

                    if (status == "active")
                        query = query.Where(c => c.Status == "Active" || c.Status == "ساري" || c.Status == "سارية");
                    else if (status == "expired")
                        query = query.Where(c => c.Status == "Expired" || c.Status == "منتهي");

                    var data = await query.Select(c => new {
                        id = c.Id,
                        col1 = c.ContractNumber,
                        col2 = c.ContractType,
                        col3 = c.Investor != null ? c.Investor.Name : "---",
                        col4 = c.Duration,
                        col5 = c.ContractValue.ToString("N2"),
                        col6 = c.Status,
                        col7 = c.EndDate.ToString("yyyy-MM-dd")
                    }).ToListAsync();

                    return Ok(data);
                }
                else if (type == "properties")
                {
                    var query = _context.Properties
                        .Include(p => p.City)
                        .Include(p => p.Owner)
                        .AsQueryable();

                    var data = await query.Select(p => new {
                        id = p.Id,
                        col1 = p.PropertyCode,
                        col2 = p.Name,
                        col3 = p.OwnershipType,
                        col4 = p.Owner != null ? p.Owner.Name : "---",
                        col5 = p.City != null ? p.City.Name : "---",
                        col6 = p.Details ?? "---",
                        col7 = p.CreatedAt.ToString("yyyy-MM-dd")
                    }).ToListAsync();

                    return Ok(data);
                }
                else if (type == "units")
                {
                    var query = _context.PropertyUnits
                        .Include(u => u.Property)
                        .AsQueryable();

                    var data = await query.Select(u => new {
                        id = u.Id,
                        col1 = u.UnitNumber,
                        col2 = u.ActivityType,
                        col3 = u.Property != null ? u.Property.Name : "---",
                        col4 = u.AreaSize.ToString() + " م²",
                        col5 = u.Status,
                        col6 = u.Description ?? "---",
                        col7 = "---"
                    }).ToListAsync();

                    return Ok(data);
                }
                else if (type == "investors")
                {
                    var query = _context.Investors.AsQueryable();

                    var data = await query.Select(i => new {
                        id = i.Id,
                        col1 = i.Name,
                        col2 = i.PhoneNumber,
                        col3 = i.Email ?? "---",
                        col4 = i.IdType + ": " + i.IdNumber,
                        col5 = i.Address ?? "---",
                        col6 = i.IsActive ? "نشط" : "غير نشط",
                        col7 = i.ExpiryDate.HasValue ? i.ExpiryDate.Value.ToString("yyyy-MM-dd") : "---"
                    }).ToListAsync();

                    return Ok(data);
                }
                else if (type == "owners")
                {
                    var query = _context.Owners.AsQueryable();

                    var data = await query.Select(o => new {
                        id = o.Id,
                        col1 = o.Name,
                        col2 = o.PhoneNumber,
                        col3 = o.Email ?? "---",
                        col4 = o.Address ?? "---",
                        col5 = "---",
                        col6 = "---",
                        col7 = "---"
                    }).ToListAsync();

                    return Ok(data);
                }
                else if (type == "payments")
                {
                    // تقرير الدفعيات والإيرادات على مستوى العقد
                    var query = _context.Contracts
                        .Include(c => c.Investor)
                        .Include(c => c.Payments)
                        .AsQueryable();

                    var data = query.ToList().Select(c => {
                        // استخدام حقل AmountPaid الصحيح الموجود في موديل ContractPayment
                        decimal totalPaid = c.Payments != null ? c.Payments.Sum(p => p.AmountPaid) : 0;
                        decimal remaining = c.ContractValue - totalPaid;

                        return new {
                            id = c.Id,
                            col1 = c.ContractNumber,
                            col2 = c.Investor != null ? c.Investor.Name : "---",
                            col3 = c.ContractValue.ToString("N2") + " ج.س",
                            col4 = c.MonthlyRentValue.ToString("N2") + " ج.س",
                            col5 = totalPaid.ToString("N2") + " ج.س",
                            col6 = remaining > 0 ? remaining.ToString("N2") + " ج.س" : "مسدد بالكامل",
                            col7 = c.Status
                        };
                    }).ToList();

                    return Ok(data);
                }

                return BadRequest(new { message = "نوع التقرير غير مدعوم" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء جلب بيانات التقارير", error = ex.Message });
            }
        }
    }
}