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
    public class PropertyController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PropertyController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/property (استعراض كل العقارات مع الوصف والوحدات)
        [HttpGet]
        public async Task<IActionResult> GetProperties()
        {
            var properties = await _context.Properties
                .Include(p => p.City)
                .Include(p => p.Owner)
                .Include(p => p.Units)
                .Select(p => new
                {
                    p.Id,
                    p.PropertyCode,
                    p.Name,
                    p.OwnershipType,
                    p.Details,
                    p.CreatedBy,
                    p.CreatedAt,
                    p.CityId,
                    City = p.City == null ? null : new
                    {
                        p.City.Id,
                        p.City.Name,
                        p.City.StateId
                    },
                    p.OwnerId,
                    Owner = p.Owner == null ? null : new
                    {
                        p.Owner.Id,
                        p.Owner.Name,
                        p.Owner.PhoneNumber
                    },
                    Units = p.Units.Select(u => new
                    {
                        u.Id,
                        u.UnitNumber,
                        u.ActivityType,
                        u.Status
                    })
                })
                .ToListAsync();

            return Ok(properties);
        }

        // 2. GET: api/property/5 (جلب عقار معين بواسطة الـ ID)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProperty(int id)
        {
            var property = await _context.Properties
                .Include(p => p.City)
                .Include(p => p.Owner)
                .Include(p => p.Units)
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.PropertyCode,
                    p.Name,
                    p.OwnershipType,
                    p.Details,
                    p.CreatedBy,
                    p.CreatedAt,
                    p.CityId,
                    City = p.City == null ? null : new
                    {
                        p.City.Id,
                        p.City.Name,
                        p.City.StateId
                    },
                    p.OwnerId,
                    Owner = p.Owner == null ? null : new
                    {
                        p.Owner.Id,
                        p.Owner.Name,
                        p.Owner.PhoneNumber
                    },
                    Units = p.Units.Select(u => new
                    {
                        u.Id,
                        u.UnitNumber,
                        u.ActivityType,
                        u.Status
                    })
                })
                .FirstOrDefaultAsync();

            if (property == null)
            {
                return NotFound(new { message = "العقار غير موجود." });
            }

            return Ok(property);
        }

        // 3. POST: api/property (إضافة عقار جديد مع التحقق)
        [HttpPost]
        public async Task<ActionResult<Property>> PostProperty(Property property)
        {
            bool codeExists = await _context.Properties
                .AnyAsync(p => p.PropertyCode.ToLower() == property.PropertyCode.ToLower());

            if (codeExists)
            {
                return BadRequest(new { message = "كود العقار هذا مسجل مسبقاً، يرجى استخدام كود فريد." });
            }

            bool cityExists = await _context.Cities.AnyAsync(c => c.Id == property.CityId);
            if (!cityExists)
            {
                return BadRequest(new { message = "المدينة المحددة غير موجودة في النظام." });
            }

            bool ownerExists = await _context.Owners.AnyAsync(o => o.Id == property.OwnerId);
            if (!ownerExists)
            {
                return BadRequest(new { message = "المالك المحدد غير موجود في النظام." });
            }

            property.CreatedAt = DateTime.UtcNow;

            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProperty), new { id = property.Id }, property);
        }

        // 4. PUT: api/property/5 (تعديل بيانات العقار)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProperty(int id, Property property)
        {
            if (id != property.Id)
            {
                return BadRequest(new { message = "معرف العقار غير متطابق." });
            }

            var existingProperty = await _context.Properties.FindAsync(id);
            if (existingProperty == null)
            {
                return NotFound(new { message = "العقار غير موجود للتعديل." });
            }

            bool codeExists = await _context.Properties
                .AnyAsync(p => p.PropertyCode.ToLower() == property.PropertyCode.ToLower() && p.Id != id);

            if (codeExists)
            {
                return BadRequest(new { message = "كود العقار هذا مستخدم بالفعل لعقار آخر." });
            }

            if (!await _context.Cities.AnyAsync(c => c.Id == property.CityId))
            {
                return BadRequest(new { message = "المدينة المحددة غير موجودة." });
            }

            if (!await _context.Owners.AnyAsync(o => o.Id == property.OwnerId))
            {
                return BadRequest(new { message = "المالك المحدد غير موجود." });
            }

            existingProperty.PropertyCode = property.PropertyCode;
            existingProperty.Name = property.Name;
            existingProperty.OwnershipType = property.OwnershipType;
            existingProperty.Details = property.Details;
            existingProperty.CityId = property.CityId;
            existingProperty.OwnerId = property.OwnerId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PropertyExists(id))
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

        // 5. DELETE: api/property/5 (حذف عقار مع التحقق من عدم وجود وحدات تابعة)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null)
            {
                return NotFound(new { message = "العقار غير موجود." });
            }

            // التصحيح هنا: استخدام PropertyUnits بدلاً من Units
            bool hasUnits = await _context.PropertyUnits.AnyAsync(u => u.PropertyId == id);
            if (hasUnits)
            {
                return BadRequest(new { message = "لا يمكن حذف هذا العقار لوجود وحدات مسجلة تابعة له. يرجى حذف الوحدات أولاً." });
            }

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 6. DELETE: api/property/deleteAll (حذف جميع العقارات مع التحقق من عدم وجود وحدات بالنظام)
        [HttpDelete("deleteAll")]
        public async Task<IActionResult> DeleteAllProperties()
        {
            // التصحيح هنا: استخدام PropertyUnits بدلاً من Units
            bool anyUnitsExist = await _context.PropertyUnits.AnyAsync();
            if (anyUnitsExist)
            {
                return BadRequest(new { message = "لا يمكن حذف جميع العقارات لوجود وحدات مسجلة مرتبطة بها في النظام." });
            }

            var properties = await _context.Properties.ToListAsync();
            if (!properties.Any())
            {
                return NotFound(new { message = "لا توجد عقارات للحذف." });
            }

            _context.Properties.RemoveRange(properties);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PropertyExists(int id)
        {
            return _context.Properties.Any(e => e.Id == id);
        }
    }
}