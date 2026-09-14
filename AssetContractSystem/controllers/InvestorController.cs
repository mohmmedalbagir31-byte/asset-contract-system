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
    public class InvestorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InvestorController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/investor (استعراض كل المستثمرين)
        [HttpGet]
        public async Task<IActionResult> GetInvestors()
        {
            var investors = await _context.Investors
                .Select(i => new
                {
                    i.Id,
                    i.Name,
                    i.PhoneNumber,
                    i.Address,
                    i.Email,
                    i.IdType,
                    i.IdNumber,
                    i.IssueDate,
                    i.ExpiryDate,
                    i.IssuePlace,
                    i.IsActive
                })
                .ToListAsync();

            return Ok(investors);
        }

        // 2. GET: api/investor/5 (جلب مستثمر معين بواسطة الـ ID مع العقارات/العقود المرتبطة به)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetInvestor(int id)
        {
            try
            {
                var investor = await _context.Investors
                    .Where(i => i.Id == id)
                    .Include(i => i.Contracts)
                        .ThenInclude(c => c.PropertyUnit)
                            .ThenInclude(u => u.Property)
                    .Select(i => new
                    {
                        i.Id,
                        i.Name,
                        i.PhoneNumber,
                        i.Address,
                        i.Email,
                        i.IdType,
                        i.IdNumber,
                        i.IssueDate,
                        i.ExpiryDate,
                        i.IssuePlace,
                        i.IsActive,
                        Contracts = i.Contracts.Select(c => new
                        {
                            c.Id,
                            ContractNumber = c.ContractNumber ?? string.Empty,
                            ContractType = c.ContractType ?? string.Empty,
                            Duration = c.Duration ?? string.Empty,
                            c.ContractValue,
                            c.MonthlyRentValue,
                            c.StartDate,
                            c.EndDate,
                            Status = c.Status ?? string.Empty,
                            UnitNumber = c.PropertyUnit != null ? c.PropertyUnit.UnitNumber : null,
                            PropertyName = c.PropertyUnit != null && c.PropertyUnit.Property != null ? c.PropertyUnit.Property.Name : null
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (investor == null)
                {
                    return NotFound(new { message = "المستثمر غير موجود" });
                }

                return Ok(investor);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ في الخادم", details = ex.Message });
            }
        }

        // 3. POST: api/investor (إضافة مستثمر جديد مع التحقق من عدم التكرار)
        [HttpPost]
        public async Task<ActionResult<Investor>> PostInvestor(Investor investor)
        {
            bool idNumberExists = await _context.Investors
                .AnyAsync(i => i.IdNumber.ToLower() == investor.IdNumber.ToLower());

            if (idNumberExists)
            {
                return BadRequest(new { message = "رقم الهوية هذا مسجل مسبقاً لمستثمر آخر." });
            }

            bool phoneExists = await _context.Investors
                .AnyAsync(i => i.PhoneNumber == investor.PhoneNumber);

            if (phoneExists)
            {
                return BadRequest(new { message = "رقم الهاتف هذا مسجل مسبقاً لمستثمر آخر." });
            }

            _context.Investors.Add(investor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInvestor), new { id = investor.Id }, investor);
        }

        // 4. PUT: api/investor/5 (تعديل بيانات مستثمر)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutInvestor(int id, Investor investor)
        {
            if (id != investor.Id)
            {
                return BadRequest(new { message = "معرف المستثمر غير متطابق." });
            }

            var existingInvestor = await _context.Investors.FindAsync(id);
            if (existingInvestor == null)
            {
                return NotFound(new { message = "المستثمر غير موجود للتعديل." });
            }

            bool idNumberExists = await _context.Investors
                .AnyAsync(i => i.IdNumber.ToLower() == investor.IdNumber.ToLower() && i.Id != id);

            if (idNumberExists)
            {
                return BadRequest(new { message = "رقم الهوية هذا مستخدم بالفعل من قبل مستثمر آخر." });
            }

            existingInvestor.Name = investor.Name;
            existingInvestor.PhoneNumber = investor.PhoneNumber;
            existingInvestor.Address = investor.Address;
            existingInvestor.Email = investor.Email;
            existingInvestor.IdType = investor.IdType;
            existingInvestor.IdNumber = investor.IdNumber;
            existingInvestor.IssueDate = investor.IssueDate;
            existingInvestor.ExpiryDate = investor.ExpiryDate;
            existingInvestor.IssuePlace = investor.IssuePlace;
            existingInvestor.IsActive = investor.IsActive;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InvestorExists(id))
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

        // 5. DELETE: api/investor/5 (حذف مستثمر محدد مع التحقق من عدم وجود عقود مرتبطة)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvestor(int id)
        {
            var investor = await _context.Investors.FindAsync(id);
            if (investor == null)
            {
                return NotFound(new { message = "المستثمر غير موجود." });
            }

            // فحص وجود عقود مرتبطة بالمستثمر قبل الحذف لحماية بيانات النظام
            bool hasContracts = await _context.Contracts.AnyAsync(c => c.InvestorId == id);
            if (hasContracts)
            {
                return BadRequest(new { message = "لا يمكن حذف هذا المستثمر لوجود عقود مرتبطة به. يرجى حذف العقود أولاً." });
            }

            _context.Investors.Remove(investor);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 6. DELETE: api/investor/deleteAll (حذف جميع المستثمرين مع التحقق من عدم وجود عقود بالنظام)
        [HttpDelete("deleteAll")]
        public async Task<IActionResult> DeleteAllInvestors()
        {
            try
            {
                bool anyContractsExist = await _context.Contracts.AnyAsync();
                if (anyContractsExist)
                {
                    return BadRequest(new { message = "لا يمكن حذف جميع المستثمرين لوجود عقود مرتبطة بهم في النظام." });
                }

                await _context.Investors.ExecuteDeleteAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء محاولة حذف جميع المستثمرين.", details = ex.Message });
            }
        }

        private bool InvestorExists(int id)
        {
            return _context.Investors.Any(e => e.Id == id);
        }
    }
}