using System.ComponentModel.DataAnnotations;

namespace AssetContractSystem.Models
{
    public class Owner
    {
        public int Id { get; set; }

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty; // اسم المالك أو الجهة المالكة

        [Required, MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty; // رقم الهاتف

        [MaxLength(200)]
        public string? Address { get; set; } // العنوان (اختياري)

        [MaxLength(100)]
        public string? Email { get; set; } // البريد الإلكتروني (اختياري)

        // علاقة: المالك الواحد قد يمتلك عدة عقارات
        public ICollection<Property> Properties { get; set; } = new List<Property>();
    }
}