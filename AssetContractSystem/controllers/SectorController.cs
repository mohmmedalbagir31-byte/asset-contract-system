using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AssetContractSystem.Data;
using AssetContractSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace AssetContractSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SectorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SectorController(AppDbContext context)
        {
            _context = context;
        }

        // 1. استعراض كل القطاعات مع ولاياتها بشكل مبسط
        [HttpGet]
        public async Task<IActionResult> GetSectors()
        {
            var sectors = await _context.Sectors
                .Include(s => s.States)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.CreatedAt,
                    States = s.States.Select(st => new
                    {
                        st.Id,
                        st.Name,
                        st.CreatedAt,
                        st.SectorId
                    })
                })
                .ToListAsync();

            return Ok(sectors);
        }

        // 2. جلب قطاع معين بواسطة الـ ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSector(int id)
        {
            var sector = await _context.Sectors
                .Include(s => s.States)
                .Where(s => s.Id == id)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.CreatedAt,
                    States = s.States.Select(st => new
                    {
                        st.Id,
                        st.Name,
                        st.CreatedAt,
                        st.SectorId
                    })
                })
                .FirstOrDefaultAsync();

            if (sector == null)
            {
                return NotFound(new { message = "القطاع غير موجود" });
            }

            return Ok(sector);
        }

        // 3. إضافة قطاع جديد (مع التحقق من عدم التكرار بالاسم)
        [HttpPost]
        public async Task<ActionResult<Sector>> CreateSector([FromBody] Sector sector)
        {
            bool sectorExists = await _context.Sectors
                .AnyAsync(s => s.Name.ToLower() == sector.Name.ToLower());

            if (sectorExists)
            {
                return BadRequest(new { message = "هذا القطاع موجود بالفعل، لا يمكن تكرار نفس الاسم." });
            }

            sector.CreatedAt = DateTime.UtcNow;
            _context.Sectors.Add(sector);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSector), new { id = sector.Id }, sector);
        }

        // 4. تعديل قطاع
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSector(int id, [FromBody] Sector sectorDto)
        {
            if (id != sectorDto.Id)
            {
                return BadRequest(new { message = "معرّف القطاع غير متطابق" });
            }

            bool nameExists = await _context.Sectors
                .AnyAsync(s => s.Name.ToLower() == sectorDto.Name.ToLower() && s.Id != id);

            if (nameExists)
            {
                return BadRequest(new { message = "هذا الاسم مستخدم مسبقاً لقطاع آخر." });
            }

            var existingSector = await _context.Sectors.FindAsync(id);
            if (existingSector == null)
            {
                return NotFound(new { message = "القطاع غير موجود" });
            }

            existingSector.Name = sectorDto.Name;
            existingSector.Description = sectorDto.Description;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SectorExists(id))
                {
                    return NotFound(new { message = "القطاع غير موجود" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // 5. حذف قطاع (مع التحقق من عدم وجود ولايات مرتبطة)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSector(int id)
        {
            var sector = await _context.Sectors.FindAsync(id);
            if (sector == null)
            {
                return NotFound(new { message = "القطاع غير موجود" });
            }

            // فحص وجود ولايات تابعة للقطاع قبل الحذف
            bool hasStates = await _context.States.AnyAsync(s => s.SectorId == id);
            if (hasStates)
            {
                return BadRequest(new { message = "لا يمكن حذف هذا القطاع لأنه يمتلك ولايات مرتبطة به. يرجى حذف أو نقل الولايات أولاً." });
            }

            _context.Sectors.Remove(sector);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف القطاع بنجاح" });
        }

        // 6. حذف كل القطاعات (مع التحقق من عدم وجود أي ولايات في النظام)
        [HttpDelete("deleteAll")]
        public async Task<IActionResult> DeleteAllSectors()
        {
            bool anyStatesExist = await _context.States.AnyAsync();
            if (anyStatesExist)
            {
                return BadRequest(new { message = "لا يمكن حذف جميع القطاعات لوجود ولايات مرتبطة بها في النظام." });
            }

            var sectors = await _context.Sectors.ToListAsync();
            if (!sectors.Any())
            {
                return NotFound(new { message = "لا توجد قطاعات للحذف" });
            }

            _context.Sectors.RemoveRange(sectors);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف جميع القطاعات بنجاح" });
        }

        private bool SectorExists(int id)
        {
            return _context.Sectors.Any(e => e.Id == id);
        }
    }
}