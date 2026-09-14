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
    public class OwnerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OwnerController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/owner (استعراض كل الملاك مع عقاراتهم بشكل مبسط)
        [HttpGet]
        public async Task<IActionResult> GetOwners()
        {
            var owners = await _context.Owners
                .Include(o => o.Properties)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.PhoneNumber,
                    o.Address,
                    o.Email,
                    Properties = o.Properties.Select(p => new
                    {
                        p.Id,
                        p.CreatedAt,
                        p.CityId
                    })
                })
                .ToListAsync();

            return Ok(owners);
        }

        // 2. GET: api/owner/5 (جلب مالك معين بواسطة الـ ID)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOwner(int id)
        {
            var owner = await _context.Owners
                .Include(o => o.Properties)
                    .ThenInclude(p => p.City)
                .Include(o => o.Properties)
                    .ThenInclude(p => p.Units)
                .Where(o => o.Id == id)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.PhoneNumber,
                    o.Address,
                    o.Email,
                    Properties = o.Properties.Select(p => new
                    {
                        p.Id,
                        p.PropertyCode,
                        p.Name,
                        p.OwnershipType,
                        CityName = p.City != null ? p.City.Name : "-",
                        UnitsCount = p.Units.Count
                    })
                })
                .FirstOrDefaultAsync();

            if (owner == null)
            {
                return NotFound(new { message = "المالك غير موجود" });
            }

            return Ok(owner);
        }

        // 3. POST: api/owner (إضافة مالك جديد مع التحقق من عدم تكرار رقم الهاتف)
        [HttpPost]
        public async Task<ActionResult<Owner>> PostOwner(Owner owner)
        {
            bool phoneExists = await _context.Owners
                .AnyAsync(o => o.PhoneNumber == owner.PhoneNumber);

            if (phoneExists)
            {
                return BadRequest(new { message = "رقم الهاتف هذا مسجل مسبقاً لمالك آخر." });
            }

            _context.Owners.Add(owner);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOwner), new { id = owner.Id }, owner);
        }

        // 4. PUT: api/owner/5 (تعديل بيانات مالك)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOwner(int id, Owner owner)
        {
            if (id != owner.Id)
            {
                return BadRequest(new { message = "معرف المالك غير متطابق." });
            }

            var existingOwner = await _context.Owners.FindAsync(id);
            if (existingOwner == null)
            {
                return NotFound(new { message = "المالك غير موجود للتعديل." });
            }

            bool phoneExists = await _context.Owners
                .AnyAsync(o => o.PhoneNumber == owner.PhoneNumber && o.Id != id);

            if (phoneExists)
            {
                return BadRequest(new { message = "رقم الهاتف هذا مستخدم بالفعل من قبل مالك آخر." });
            }

            existingOwner.Name = owner.Name;
            existingOwner.PhoneNumber = owner.PhoneNumber;
            existingOwner.Address = owner.Address;
            existingOwner.Email = owner.Email;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OwnerExists(id))
                {
                    return NotFound(new { message = "المالك غير موجود." });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // 5. DELETE: api/owner/5 (حذف مالك محدد مع التحقق من عدم وجود عقارات مرتبطة)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOwner(int id)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null)
            {
                return NotFound(new { message = "المالك غير موجود." });
            }

            // فحص ما إذا كان للمالك عقارات مسجلة قبل الحذف لحماية بيانات النظام
            bool hasProperties = await _context.Properties.AnyAsync(p => p.OwnerId == id);
            if (hasProperties)
            {
                return BadRequest(new { message = "لا يمكن حذف هذا المالك لوجود عقارات أو أصول مسجلة باسمه. يرجى نقل العقارات أو حذفها أولاً." });
            }

            _context.Owners.Remove(owner);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف المالك بنجاح" });
        }

        // 6. DELETE: api/owner/deleteAll (حذف كل الملاك مع التحقق من عدم وجود عقارات بالنظام)
        [HttpDelete("deleteAll")]
        public async Task<IActionResult> DeleteAllOwners()
        {
            bool anyPropertiesExist = await _context.Properties.AnyAsync();
            if (anyPropertiesExist)
            {
                return BadRequest(new { message = "لا يمكن حذف جميع الملاك لوجود عقارات مسجلة مرتبطة بهم في النظام." });
            }

            var owners = await _context.Owners.ToListAsync();
            if (!owners.Any())
            {
                return NotFound(new { message = "لا توجد سجلات ملاك للحذف." });
            }

            _context.Owners.RemoveRange(owners);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف جميع الملاك بنجاح" });
        }

        private bool OwnerExists(int id)
        {
            return _context.Owners.Any(e => e.Id == id);
        }
    }
}