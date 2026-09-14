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
    public class StateController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StateController(AppDbContext context)
        {
            _context = context;
        }

        // 1. استعراض كل الولايات
        [HttpGet]
        public async Task<IActionResult> GetStates()
        {
            var states = await _context.States
                .Include(s => s.Sector)
                .Include(s => s.Cities)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.CreatedAt,
                    s.SectorId,
                    SectorName = s.Sector != null ? s.Sector.Name : "بدون قطاع",
                    Sector = s.Sector == null ? null : new
                    {
                        s.Sector.Id,
                        s.Sector.Name,
                        s.Sector.Description,
                        s.Sector.CreatedAt
                    },
                    Cities = s.Cities.Select(c => new { c.Id, c.Name, c.CreatedAt, c.StateId })
                })
                .ToListAsync();

            return Ok(states);
        }

        // 2. جلب ولاية معينة بواسطة الـ ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetState(int id)
        {
            var state = await _context.States
                .Include(s => s.Sector)
                .Include(s => s.Cities)
                .Where(s => s.Id == id)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.CreatedAt,
                    s.SectorId,
                    SectorName = s.Sector != null ? s.Sector.Name : "بدون قطاع",
                    Sector = s.Sector == null ? null : new
                    {
                        s.Sector.Id,
                        s.Sector.Name,
                        s.Sector.Description,
                        s.Sector.CreatedAt
                    },
                    Cities = s.Cities.Select(c => new { c.Id, c.Name, c.CreatedAt, c.StateId })
                })
                .FirstOrDefaultAsync();

            if (state == null)
            {
                return NotFound(new { message = "الولاية غير موجودة" });
            }

            return Ok(state);
        }

        // 3. إضافة ولاية جديدة
        [HttpPost]
        public async Task<ActionResult<State>> PostState([FromBody] State state)
        {
            var sectorExists = await _context.Sectors.AnyAsync(s => s.Id == state.SectorId);
            if (!sectorExists)
            {
                return BadRequest(new { message = "القطاع المرتبط بهذه الولاية غير موجود." });
            }

            bool stateExists = await _context.States
                .AnyAsync(s => s.Name.ToLower() == state.Name.ToLower() && s.SectorId == state.SectorId);

            if (stateExists)
            {
                return BadRequest(new { message = "هذه الولاية موجودة بالفعل في هذا القطاع، لا يمكن تكرارها." });
            }

            state.CreatedAt = DateTime.UtcNow;
            _context.States.Add(state);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetState), new { id = state.Id }, state);
        }

        // 4. تعديل ولاية
        [HttpPut("{id}")]
        public async Task<IActionResult> PutState(int id, [FromBody] State stateDto)
        {
            if (id != stateDto.Id)
            {
                return BadRequest(new { message = "معرّف الولاية غير متطابق" });
            }

            var sectorExists = await _context.Sectors.AnyAsync(s => s.Id == stateDto.SectorId);
            if (!sectorExists)
            {
                return BadRequest(new { message = "القطاع المختار غير موجود." });
            }

            bool nameExists = await _context.States
                .AnyAsync(s => s.Name.ToLower() == stateDto.Name.ToLower() && s.SectorId == stateDto.SectorId && s.Id != id);

            if (nameExists)
            {
                return BadRequest(new { message = "هذا الاسم مستخدم مسبقاً لولاية أخرى تحت نفس القطاع." });
            }

            var existingState = await _context.States.FindAsync(id);
            if (existingState == null)
            {
                return NotFound(new { message = "الولاية غير موجودة" });
            }

            existingState.Name = stateDto.Name;
            existingState.SectorId = stateDto.SectorId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StateExists(id))
                {
                    return NotFound(new { message = "الولاية غير موجودة" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // 5. حذف ولاية محددة (مع التحقق من عدم وجود مدن تابعة)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteState(int id)
        {
            var state = await _context.States.FindAsync(id);
            if (state == null)
            {
                return NotFound(new { message = "الولاية غير موجودة" });
            }

            // فحص وجود مدن تابعة لهذه الولاية
            bool hasCities = await _context.Cities.AnyAsync(c => c.StateId == id);
            if (hasCities)
            {
                return BadRequest(new { message = "لا يمكن حذف هذه الولاية لوجود مدن تابعة لها. يرجى حذف المدن أولاً." });
            }

            _context.States.Remove(state);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف الولاية بنجاح" });
        }

        // 6. حذف كل الولايات (مع التحقق من عدم وجود مدن بالقطاع)
        [HttpDelete("deleteAll")]
        public async Task<IActionResult> DeleteAllStates()
        {
            bool anyCitiesExist = await _context.Cities.AnyAsync();
            if (anyCitiesExist)
            {
                return BadRequest(new { message = "لا يمكن حذف جميع الولايات لوجود مدن تابعة لها في النظام." });
            }

            var states = await _context.States.ToListAsync();
            if (!states.Any())
            {
                return NotFound(new { message = "لا توجد ولايات للحذف" });
            }

            _context.States.RemoveRange(states);
            await _context.SaveChangesAsync();

            return Ok(new { message = "تم حذف جميع الولايات بنجاح" });
        }

        private bool StateExists(int id)
        {
            return _context.States.Any(e => e.Id == id);
        }
    }
}