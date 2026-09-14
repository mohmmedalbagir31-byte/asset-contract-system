using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetContractSystem.Models
{
    public class Property
    {
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string PropertyCode { get; set; } = string.Empty; // كود العقار/المجمع العام

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty; // اسم العقار أو المجمع

        [Required, MaxLength(100)]
        public string OwnershipType { get; set; } = string.Empty; // نوع الملكية

        [MaxLength(500)]
        public string? Details { get; set; } // تفاصيل إضافية عن العقار

        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // مفتاح أجنبي للمدينة
        public int CityId { get; set; }

        [ForeignKey("CityId")]
        public City? City { get; set; }

        // مفتاح أجنبي للمالك
        public int OwnerId { get; set; }

        [ForeignKey("OwnerId")]
        public Owner? Owner { get; set; }

        // العلاقة: العقار الأساسي يضم عدة وحدات إيجارية
        public ICollection<PropertyUnit> Units { get; set; } = new List<PropertyUnit>();
    }
}