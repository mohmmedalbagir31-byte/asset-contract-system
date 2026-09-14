using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AssetContractSystem.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AssetContractSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // نموذج بيانات تسجيل الدخول (DTO بسيط داخلي)
        public class LoginDto
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            // البحث عن المستخدم في قاعدة البيانات
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username.ToLower() == model.Username.ToLower() && u.IsActive);

            if (user == null || user.PasswordHash != model.Password)
            {
                return Unauthorized(new { message = "اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب موقوف." });
            }

            // توليد الـ JWT Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role)
                }),
                Expires = DateTime.UtcNow.AddDays(Convert.ToDouble(jwtSettings["DurationInDays"] ?? "7")),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // إرجاع الـ Token مع معلومات المستخدم الأساسية
            return Ok(new
            {
                token = tokenString,
                username = user.Username,
                fullName = user.FullName,
                role = user.Role,
                expiresAt = tokenDescriptor.Expires
            });
        }
    }
}