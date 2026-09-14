using AssetContractSystem.Data;
using AssetContractSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssetContractSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ContractPaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContractPaymentController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/contractpayment (استعراض كل الدفوعات المالية المسجلة)
        [HttpGet]
        public async Task<IActionResult> GetPayments()
        {
            var payments = await _context.Set<ContractPayment>()
                .Include(p => p.Contract)
                .Select(p => new
                {
                    p.Id,
                    p.ContractId,
                    ContractNumber = p.Contract != null ? p.Contract.ContractNumber : string.Empty,
                    p.AmountPaid,
                    p.PaymentDate,
                    p.PaymentType,
                    p.PaymentMethod,
                    p.ReferenceNumber,
                    p.Notes,
                    p.CreatedBy
                })
                .ToListAsync();

            return Ok(payments);
        }

        // 2. GET: api/contractpayment/5 (جلب دفعة معينة بواسطة الـ ID)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPayment(int id)
        {
            var payment = await _context.Set<ContractPayment>()
                .Include(p => p.Contract)
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.ContractId,
                    ContractNumber = p.Contract != null ? p.Contract.ContractNumber : string.Empty,
                    p.AmountPaid,
                    p.PaymentDate,
                    p.PaymentType,
                    p.PaymentMethod,
                    p.ReferenceNumber,
                    p.Notes,
                    p.CreatedBy
                })
                .FirstOrDefaultAsync();

            if (payment == null)
            {
                return NotFound(new { message = "الدفعة المالية غير موجودة." });
            }

            return Ok(payment);
        }

        // 3. GET: api/contractpayment/contract/5 (التقرير المالي الشامل لعقد معين: إجمالي، مدفوع، متبقي)
        [HttpGet("contract/{contractId}")]
        public async Task<IActionResult> GetContractFinancialSummary(int contractId)
        {
            var contract = await _context.Contracts
                .Include(c => c.City) // مدينة توقيع العقد
                .Include(c => c.Investor) // المستثمر
                .Include(c => c.PropertyUnit)
                    .ThenInclude(u => u.Property)
                        .ThenInclude(p => p.City)
                            .ThenInclude(ci => ci.State)
                                .ThenInclude(s => s.Sector) // جلب المدينة والولاية والقطاع للعقار
                .Include(c => c.PropertyUnit)
                    .ThenInclude(u => u.Property)
                        .ThenInclude(p => p.Owner) // مالك العقار
                .Where(c => c.Id == contractId)
                .FirstOrDefaultAsync();

            if (contract == null)
            {
                return NotFound(new { message = "العقد غير موجود." });
            }

            var payments = await _context.Set<ContractPayment>()
                .Where(p => p.ContractId == contractId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            decimal totalPaid = payments.Sum(p => p.AmountPaid);
            decimal totalContractValue = contract.ContractValue + contract.Annex;
            decimal remainingAmount = totalContractValue - totalPaid;

            string paymentStatus = totalPaid >= totalContractValue ? "مسدد بالكامل" : (totalPaid > 0 ? "مسدد جزئياً" : "غير مسدد");

            var summary = new
            {
                ContractId = contract.Id,
                contract.ContractNumber,
                contract.ContractType,
                contract.Duration,
                contract.ContractValue,
                contract.Annex,
                contract.AnnexSummary,
                contract.MonthlyRentValue,
                TotalContractValue = totalContractValue,
                contract.StartDate,
                contract.EndDate,
                contract.Summary,
                contract.Status,
                contract.CreatedBy,
                ContractCityName = contract.City?.Name,

                // بيانات المستثمر كامدة
                InvestorId = contract.Investor?.Id,
                InvestorName = contract.Investor?.Name,
                InvestorPhone = contract.Investor?.PhoneNumber,
                InvestorEmail = contract.Investor?.Email,
                InvestorAddress = contract.Investor?.Address,
                InvestorIdType = contract.Investor?.IdType,
                InvestorIdNumber = contract.Investor?.IdNumber,
                InvestorIssueDate = contract.Investor?.IssueDate,
                InvestorExpiryDate = contract.Investor?.ExpiryDate,
                InvestorIssuePlace = contract.Investor?.IssuePlace,

                // بيانات الوحدة العقارية
                UnitId = contract.PropertyUnit?.Id,
                UnitNumber = contract.PropertyUnit?.UnitNumber,
                ActivityType = contract.PropertyUnit?.ActivityType,
                AreaSize = contract.PropertyUnit?.AreaSize,
                UnitStatus = contract.PropertyUnit?.Status,

                // بيانات العقار الأم والموقع الجغرافي (بدون لينك)
                PropertyId = contract.PropertyUnit?.Property?.Id,
                PropertyName = contract.PropertyUnit?.Property?.Name,
                PropertyCode = contract.PropertyUnit?.Property?.PropertyCode,
                PropertyCityName = contract.PropertyUnit?.Property?.City?.Name,
                PropertyStateName = contract.PropertyUnit?.Property?.City?.State?.Name,
                PropertySectorName = contract.PropertyUnit?.Property?.City?.State?.Sector?.Name,

                // بيانات المالك كاملة
                OwnerId = contract.PropertyUnit?.Property?.Owner?.Id,
                OwnerName = contract.PropertyUnit?.Property?.Owner?.Name,
                OwnerPhone = contract.PropertyUnit?.Property?.Owner?.PhoneNumber,
                OwnerEmail = contract.PropertyUnit?.Property?.Owner?.Email,
                OwnerAddress = contract.PropertyUnit?.Property?.Owner?.Address,

                TotalPaid = totalPaid,
                RemainingAmount = remainingAmount < 0 ? 0 : remainingAmount,
                PaymentStatus = paymentStatus,

                PaymentsList = payments.Select(p => new
                {
                    p.Id,
                    p.AmountPaid,
                    p.PaymentDate,
                    p.PaymentType,
                    p.PaymentMethod,
                    p.ReferenceNumber,
                    p.Notes,
                    p.CreatedBy
                })
            };
            return Ok(summary);
        }
        // 4. POST: api/contractpayment (تسجيل دفعة مالية جديدة للعقد)
        [HttpPost]
        public async Task<ActionResult<ContractPayment>> PostPayment(ContractPayment payment)
        {
            // أ. التحقق من أن العقد المرتبط موجود فعلياً
            var contract = await _context.Contracts.FindAsync(payment.ContractId);
            if (contract == null)
            {
                return BadRequest(new { message = "العقد المرتبط بهذه الدفعة غير موجود في النظام." });
            }

            // ب. التحقق من أن المبلغ المدفوع أكبر من صفر
            if (payment.AmountPaid <= 0)
            {
                return BadRequest(new { message = "يجب أن يكون مبلغ الدفعة أكبر من الصفر." });
            }

            // (اختياري / تنبيه ذكي): هل المبلغ المدفوع يتجاوز المتبقي من العقد؟
            var currentTotalPaid = await _context.Set<ContractPayment>()
                .Where(p => p.ContractId == payment.ContractId)
                .SumAsync(p => (decimal?)p.AmountPaid) ?? 0;

            decimal remaining = contract.ContractValue - currentTotalPaid;
            if (payment.AmountPaid > remaining)
            {
                // نكتفي بإرجاع تحذير أو منع العملية حسب رغبة النظام، هنا سنسمح بها مع رسالة تنبيه أو نمنعها إن أردت الصرامة المالية
                // سنقوم بالسماح بها لكن مع ملاحظة في الرد أو إيقافها إذا تجاوزت الحد تماماً:
                return BadRequest(new { message = $"المبلغ المدفوع ({payment.AmountPaid}) يتجاوز المبلغ المتبقي من العقد والذي يبلغ ({remaining})." });
            }

            payment.PaymentDate = payment.PaymentDate == default ? DateTime.UtcNow : payment.PaymentDate;

            _context.Set<ContractPayment>().Add(payment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, payment);
        }

        // 5. PUT: api/contractpayment/5 (تعديل تفاصيل دفعة سابقة)
        // 5. PUT: api/contractpayment/5 (تعديل تفاصيل دفعة سابقة مع التحقق المالي)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPayment(int id, ContractPayment payment)
        {
            if (id != payment.Id)
            {
                return BadRequest(new { message = "معرف الدفعة غير متطابق." });
            }

            var existingPayment = await _context.Set<ContractPayment>().AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
            if (existingPayment == null)
            {
                return NotFound(new { message = "الدفعة المالية غير موجودة للتعديل." });
            }

            var contract = await _context.Contracts.FindAsync(payment.ContractId);
            if (contract == null)
            {
                return BadRequest(new { message = "العقد المرتبط غير موجود." });
            }

            // فحص المبلغ المتبقي مع استثناء الدفعة الحالية قيد التعديل
            var currentTotalPaid = await _context.Set<ContractPayment>()
                .Where(p => p.ContractId == payment.ContractId && p.Id != id)
                .SumAsync(p => (decimal?)p.AmountPaid) ?? 0;

            decimal remaining = contract.ContractValue - currentTotalPaid;
            if (payment.AmountPaid > remaining)
            {
                return BadRequest(new { message = $"المبلغ المدفوع المعدل ({payment.AmountPaid}) يتجاوز المبلغ المتبقي من العقد والذي يبلغ ({remaining})." });
            }

            _context.Entry(payment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }
        // 6. DELETE: api/contractpayment/5 (حذف دفعة مالية مسجلة)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Set<ContractPayment>().FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "الدفعة غير موجودة." });
            }

            _context.Set<ContractPayment>().Remove(payment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymentExists(int id)
        {
            return _context.Set<ContractPayment>().Any(e => e.Id == id);
        }
    }
}
