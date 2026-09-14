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
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/user (استعراض كل المستخدمين - بدون إظهار كلمة المرور لأسباب أمنية)
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // 2. GET: api/user/5 (جلب مستخدم معين بواسطة الـ ID)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "المستخدم غير موجود" });
            }

            return Ok(user);
        }

        // 3. POST: api/user (إضافة مستخدم جديد مع التحقق من عدم تكرار اسم المستخدم)
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            // التحقق من أن اسم المستخدم غير مسجل مسبقاً
            bool usernameExists = await _context.Users
                .AnyAsync(u => u.Username.ToLower() == user.Username.ToLower());

            if (usernameExists)
            {
                return BadRequest(new { message = "اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم آخر." });
            }

            // التحقق من البريد الإلكتروني إذا تم إدخاله
            if (!string.IsNullOrEmpty(user.Email))
            {
                bool emailExists = await _context.Users
                    .AnyAsync(u => u.Email != null && u.Email.ToLower() == user.Email.ToLower());

                if (emailExists)
                {
                    return BadRequest(new { message = "البريد الإلكتروني هذا مسجل مسبقاً لحساب آخر." });
                }
            }

            user.CreatedAt = DateTime.UtcNow;
            
            // (ملاحظة أمنية مستقبلاً): يفضل تشفير كلمة المرور (PasswordHash) هنا قبل حفظها باستخدام BCrypt أو ASP.NET Core Identity

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // إرجاع النتيجة بدون كلمة المرور في الرد
            var responseDto = new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Email,
                user.Role,
                user.IsActive,
                user.CreatedAt
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, responseDto);
        }

        // 4. PUT: api/user/5 (تعديل بيانات المستخدم)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id)
            {
                return BadRequest(new { message = "معرف المستخدم غير متطابق." });
            }

            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null)
            {
                return NotFound(new { message = "المستخدم غير موجود للتعديل." });
            }

            // التحقق من عدم تكرار اسم المستخدم لشخص آخر
            bool usernameExists = await _context.Users
                .AnyAsync(u => u.Username.ToLower() == user.Username.ToLower() && u.Id != id);

            if (usernameExists)
            {
                return BadRequest(new { message = "اسم المستخدم هذا مسجل لمستخدم آخر." });
            }

            existingUser.Username = user.Username;
            existingUser.FullName = user.FullName;
            existingUser.Email = user.Email;
            existingUser.Role = user.Role;
            existingUser.IsActive = user.IsActive;

            // إذا تم إرسال كلمة مرور جديدة، يتم تحديثها، وإذا تركت فارغة يمكن الاحتفاظ بالقديمة
            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                existingUser.PasswordHash = user.PasswordHash;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
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

        // 5. DELETE: api/user/5 (حذف المستخدم)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "المستخدم غير موجود." });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.Id == e.Id);
        }
    }
}