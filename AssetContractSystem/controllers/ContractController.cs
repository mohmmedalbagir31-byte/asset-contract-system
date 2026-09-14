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
    public class ContractController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContractController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/contract
        [HttpGet]
        public async Task<IActionResult> GetContracts()
        {
            var contracts = await _context.Contracts
                .Include(c => c.PropertyUnit)
                .Include(c => c.Investor)
                .Include(c => c.City)
                .Include(c => c.Payments)
                .ToListAsync();

            return Ok(contracts);
        }

        // 2. GET: api/contract/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetContract(int id)
        {
            var contract = await _context.Contracts
                .Include(c => c.PropertyUnit)
                .Include(c => c.Investor)
                .Include(c => c.City)
                .Include(c => c.Payments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (contract == null)
            {
                return NotFound(new { message = "العقد غير موجود." });
            }

            return Ok(contract);
        }

        // 3. POST: api/contract
        [HttpPost]
        public async Task<ActionResult<Contract>> PostContract(Contract contract)
        {
            var unit = await _context.PropertyUnits.FindAsync(contract.PropertyUnitId);
            if (unit == null)
            {
                return BadRequest(new { message = "الوحدة العقارية غير موجودة." });
            }

            if (contract.Status == "ساري" && unit.Status == "مؤجرة")
            {
                return BadRequest(new { message = "هذه الوحدة مؤجرة بالفعل ولا يمكن ربطها بعقد جديد ساري." });
            }

            _context.Contracts.Add(contract);
            await _context.SaveChangesAsync();

            if (contract.Status == "ساري")
            {
                unit.Status = "مؤجرة";
                _context.PropertyUnits.Update(unit);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction("GetContract", new { id = contract.Id }, contract);
        }

        // 4. PUT: api/contract/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutContract(int id, Contract contract)
        {
            if (id != contract.Id) return BadRequest();

            var existingContract = await _context.Contracts.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
            if (existingContract == null) return NotFound();

            _context.Entry(contract).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            var unit = await _context.PropertyUnits.FindAsync(contract.PropertyUnitId);
            if (unit != null)
            {
                if (contract.Status == "ملغي" || contract.Status == "منتهي")
                {
                    unit.Status = "شاغر";
                }
                else if (contract.Status == "ساري")
                {
                    unit.Status = "مؤجرة";
                }
                _context.PropertyUnits.Update(unit);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        // 5. DELETE: api/contract/5 (معالجة مشكلة الدفعات المرتبطة عند الحذف)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContract(int id)
        {
            var contract = await _context.Contracts.FindAsync(id);
            if (contract == null) return NotFound();

            // فحص الدفعات المالية باستخدام ContractPayments لمنع حدوث خطأ في قاعدة البيانات
            bool hasPayments = await _context.ContractPayments.AnyAsync(p => p.ContractId == id);
            if (hasPayments)
            {
                return BadRequest(new { message = "لا يمكن حذف هذا العقد لوجود دفعات مالية مرتبطة به. يرجى حذف الدفعات أولاً." });
            }

            var unit = await _context.PropertyUnits.FindAsync(contract.PropertyUnitId);
            if (unit != null)
            {
                unit.Status = "شاغر";
                _context.PropertyUnits.Update(unit);
            }

            _context.Contracts.Remove(contract);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}