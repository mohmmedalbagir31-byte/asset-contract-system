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
    public class CityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CityController(AppDbContext context)
        {
            _context = context;
        }

        // 1. استعراض كل المدن
        [HttpGet]
        public async Task<IActionResult> GetCities()
        {
            var cities = await _context.Cities
                .Include(c => c.State)
                .ThenInclude(st => st!.Sector)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.CreatedAt,
                    c.StateId,
                    StateName = c.State != null ? c.State.Name : "بدون محلية",
                    SectorName = c.State != null && c.State.Sector != null ? c.State.Sector.Name : "بدون قطاع",
                    State = c.State == null ? null : new
                    {
                        c.State.Id,
                        c.State.Name,
                        c.State.CreatedAt,
                        c.State.SectorId
                    }
                })
                .ToListAsync();

            return Ok(cities);
        }

        // 2. جلب مدينة معينة بواسطة الـ ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCity(int id)
        {
            var city = await _context.Cities
                .Include(c => c.State)
                .ThenInclude(st => st!.Sector)
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.CreatedAt,
                    c.StateId,
                    StateName = c.State != null ? c.State.Name : "بدون محلية",
                    SectorName = c.State != null && c.State.Sector != null ? c.State.Sector.Name : "بدون قطاع",
                    State = c.State == null ? null : new
                    {
                        c.State.Id,
                        c.State.Name,
                        c.State.CreatedAt,
                        c.State.SectorId
                    }
                })
                .FirstOrDefaultAsync();

            if (city == null)
            {
                return NotFound(new { message = "المدينة غير موجودة" });
            }

            return Ok(city);
        }

        // 3. إضافة مدينة جديدة
        [HttpPost]
        public async Task<ActionResult<City>> PostCity([FromBody] City city)
        {
            var stateExists = await _context.States.AnyAsync(st => st.Id == city.StateId);
            if (!stateExists)
            {
                return BadRequest(new { message = "المحلية المرتبطة بهذه المدينة غير موجودة." });
            }

            bool cityExists = await _context.Cities
                .AnyAsync(c => c.Name.ToLower() == city.Name.ToLower() && c.StateId == city.StateId);

            if (cityExists)
            {
                return BadRequest(new { message = "هذه المدينة موجودة بالفعل في هذه المحلية، لا يمكن تكرارها." });
            }

            city.CreatedAt = DateTime.UtcNow;
            _context.Cities.Add(city);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCity), new { id = city.Id }, city);
        }

        // 4. تعديل مدينة
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCity(int id, [FromBody] City cityDto)
        {
            if (id != cityDto.Id)
            {
                return BadRequest(new { message = "معرّف المدينة غير متطابق" });
            }

            var stateExists = await _context.States.AnyAsync(st => st.Id == cityDto.StateId);
            if (!stateExists)
            {
                return BadRequest(new { message = "المحلية المختارة غير موجودة." });
            }

            bool nameExists = await _context.Cities
                .AnyAsync(c => c.Name.ToLower() == cityDto.Name.ToLower() && c.StateId == cityDto.StateId && c.Id != id);

            if (nameExists)
            {
                return BadRequest(new { message = "هذا الاسم مستخدم مسبقاً لمدينة أخرى تحت نفس المحلية." });
            }

            var existingCity = await _context.Cities.FindAsync(id);
            if (existingCity == null)
            {
                return NotFound(new { message = "المدينة غير موجودة" });
            }

            existingCity.Name = cityDto.Name;
            existingCity.StateId = cityDto.StateId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CityExists(id))
                {
                    return NotFound(new { message = "المدينة غير موجودة" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // 5. حذف مدينة محددة (مع التحقق من عدم وجود عقارات/أصول مسجلة فيها)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCity(int id)
        {
            var city = await _context.Cities.FindAsync(id);
            if (city == null)
            {
                return NotFound(new { message = "المدينة غير موجودة" });
            }

            // فحص وجود أصول أو عقارات مرتبطة بهذه المدينة
            bool hasProperties = await _context.Properties.AnyAsync(p => p.CityId == id);
            if (hasProperties)
            {
                return BadRequest(new { message = "لا يمكن حذف هذه المدينة لوجود أصول أو عقارات مسجلة فيها." });
            }

            _context.Cities.Remove(city);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف المدينة بنجاح" });
        }

        // 6. حذف كل المدن (مع التحقق من عدم وجود أصول بالنظام)
        [HttpDelete("deleteAll")]
        public async Task<IActionResult> DeleteAllCities()
        {
            bool anyPropertiesExist = await _context.Properties.AnyAsync();
            if (anyPropertiesExist)
            {
                return BadRequest(new { message = "لا يمكن حذف جميع المدن لوجود أصول أو عقارات مسجلة مرتبطة بها." });
            }

            var cities = await _context.Cities.ToListAsync();
            if (!cities.Any())
            {
                return NotFound(new { message = "لا توجد مدن للحذف" });
            }

            _context.Cities.RemoveRange(cities);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف جميع المدن بنجاح" });
        }

        private bool CityExists(int id)
        {
            return _context.Cities.Any(e => e.Id == id);
        }
    }
}