using System.ComponentModel.DataAnnotations;

namespace AssetContractSystem.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Username { get; set; } = string.Empty; // اسم المستخدم للتسجيل

        [Required, MaxLength(150)]
        public string FullName { get; set; } = string.Empty; // الاسم الكامل للموظف

        [Required, MaxLength(256)]
        public string PasswordHash { get; set; } = string.Empty; // كلمة المرور المشفرة

        [MaxLength(100)]
        public string? Email { get; set; } // البريد الإلكتروني

        [Required, MaxLength(50)]
        public string Role { get; set; } = "User"; // الصلاحية (مدير النظام، موظف إدخال، إلخ)

        public bool IsActive { get; set; } = true; // هل الحساب نشط أم موقوف؟

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}