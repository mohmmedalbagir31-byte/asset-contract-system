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
    public class PropertyUnitController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PropertyUnitController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/propertyunit (استعراض كل الوحدات مع بيانات العقار التابعة لها بشكل مبسط)
        [HttpGet]
        public async Task<IActionResult> GetPropertyUnits()
        {
            var units = await _context.PropertyUnits
                .Include(u => u.Property)
                .Select(u => new
                {
                    u.Id,
                    u.UnitNumber,
                    u.ActivityType,
                    u.AreaSize,
                    u.Status,
                    u.Description,
                    u.PropertyId,
                    Property = u.Property == null ? null : new
                    {
                        u.Property.Id,
                        u.Property.PropertyCode,
                        u.Property.Name,
                        u.Property.OwnershipType
                    }
                })
                .ToListAsync();

            return Ok(units);
        }

        // 2. GET: api/propertyunit/5 (جلب وحدة معينة بواسطة الـ ID مع العقود الخاصة بها)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPropertyUnit(int id)
        {
            var unit = await _context.PropertyUnits
                .Include(u => u.Property)
                .Include(u => u.Contracts)
                    .ThenInclude(c => c.Investor)
                .Include(u => u.Contracts)
                    .ThenInclude(c => c.City)
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    u.Id,
                    u.UnitNumber,
                    u.ActivityType,
                    u.AreaSize,
                    u.Status,
                    u.Description,
                    u.PropertyId,
                    Property = u.Property == null ? null : new
                    {
                        u.Property.Id,
                        u.Property.PropertyCode,
                        u.Property.Name,
                        u.Property.OwnershipType
                    },
                    Contracts = u.Contracts
                        .OrderByDescending(c => c.Id)
                        .Select(c => new
                        {
                            c.Id,
                            c.ContractNumber,
                            c.ContractType,
                            c.Duration,
                            c.ContractValue,
                            StartDate = c.StartDate.ToString("yyyy-MM-dd"),
                            EndDate = c.EndDate.ToString("yyyy-MM-dd"),
                            c.Status,
                            InvestorName = c.Investor != null ? c.Investor.Name : "غير متوفر",
                            CityName = c.City != null ? c.City.Name : "غير متوفر"
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (unit == null)
            {
                return NotFound(new { message = "الوحدة العقارية غير موجودة." });
            }

            return Ok(unit);
        }

        // 3. GET: api/propertyunit/property/5 (جلب كل الوحدات الخاصة بعقار معين)
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetUnitsByProperty(int propertyId)
        {
            var units = await _context.PropertyUnits
                .Where(u => u.PropertyId == propertyId)
                .Select(u => new
                {
                    u.Id,
                    u.UnitNumber,
                    u.ActivityType,
                    u.AreaSize,
                    u.Status,
                    u.Description,
                    u.PropertyId
                })
                .ToListAsync();

            return Ok(units);
        }

        // 4. POST: api/propertyunit (إضافة وحدة جديدة مع التحقق من عدم تكرارها داخل نفس العقار)
        [HttpPost]
        public async Task<ActionResult<PropertyUnit>> PostPropertyUnit(PropertyUnit propertyUnit)
        {
            bool propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyUnit.PropertyId);
            if (!propertyExists)
            {
                return BadRequest(new { message = "العقار الأساسي المحدد غير موجود في النظام." });
            }

            bool unitExistsInProperty = await _context.PropertyUnits
                .AnyAsync(u => u.PropertyId == propertyUnit.PropertyId && u.UnitNumber.ToLower() == propertyUnit.UnitNumber.ToLower());

            if (unitExistsInProperty)
            {
                return BadRequest(new { message = "رقم هذه الوحدة مسجل مسبقاً في هذا العقار." });
            }

            _context.PropertyUnits.Add(propertyUnit);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPropertyUnit), new { id = propertyUnit.Id }, propertyUnit);
        }

        // 5. PUT: api/propertyunit/5 (تعديل بيانات الوحدة)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPropertyUnit(int id, PropertyUnit propertyUnit)
        {
            if (id != propertyUnit.Id)
            {
                return BadRequest(new { message = "معرف الوحدة غير متطابق." });
            }

            var existingUnit = await _context.PropertyUnits.FindAsync(id);
            if (existingUnit == null)
            {
                return NotFound(new { message = "الوحدة غير موجودة للتعديل." });
            }

            bool propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyUnit.PropertyId);
            if (!propertyExists)
            {
                return BadRequest(new { message = "العقار المحدد غير موجود." });
            }

            bool unitExistsInProperty = await _context.PropertyUnits
                .AnyAsync(u => u.PropertyId == propertyUnit.PropertyId && u.UnitNumber.ToLower() == propertyUnit.UnitNumber.ToLower() && u.Id != id);

            if (unitExistsInProperty)
            {
                return BadRequest(new { message = "رقم هذه الوحدة مستخدم بالفعل في نفس العقار." });
            }

            existingUnit.UnitNumber = propertyUnit.UnitNumber;
            existingUnit.ActivityType = propertyUnit.ActivityType;
            existingUnit.AreaSize = propertyUnit.AreaSize;
            existingUnit.Status = propertyUnit.Status;
            existingUnit.Description = propertyUnit.Description;
            existingUnit.PropertyId = propertyUnit.PropertyId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PropertyUnitExists(id))
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

        // 6. DELETE: api/propertyunit/5 (حذف وحدة مع التحقق من عدم وجود عقود مرتبطة)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePropertyUnit(int id)
        {
            var unit = await _context.PropertyUnits.FindAsync(id);
            if (unit == null)
            {
                return NotFound(new { message = "الوحدة غير موجودة." });
            }

            // فحص وجود عقود مرتبطة بالوحدة قبل الحذف لحماية بيانات النظام
            bool hasContracts = await _context.Contracts.AnyAsync(c => c.PropertyUnitId == id);
            if (hasContracts)
            {
                return BadRequest(new { message = "لا يمكن حذف هذه الوحدة لوجود عقود مسجلة مرتبطة بها. يرجى حذف العقود أولاً." });
            }

            _context.PropertyUnits.Remove(unit);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 7. DELETE: api/propertyunit/deleteAll (حذف جميع الوحدات مع التحقق من عدم وجود عقود بالنظام)
        [HttpDelete("deleteAll")]
        public async Task<IActionResult> DeleteAllPropertyUnits()
        {
            bool anyContractsExist = await _context.Contracts.AnyAsync();
            if (anyContractsExist)
            {
                return BadRequest(new { message = "لا يمكن حذف جميع الوحدات لوجود عقود مسجلة مرتبطة بها في النظام." });
            }

            var units = await _context.PropertyUnits.ToListAsync();
            if (!units.Any())
            {
                return NotFound(new { message = "لا توجد وحدات للحذف." });
            }

            _context.PropertyUnits.RemoveRange(units);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PropertyUnitExists(int id)
        {
            return _context.PropertyUnits.Any(e => e.Id == id);
        }
    }
}