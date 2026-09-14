using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetContractSystem.Models
{
    public class PropertyUnit
    {
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string UnitNumber { get; set; } = string.Empty; // رقم الوحدة (دكان رقم 5، شقة 2)

        [Required, MaxLength(100)]
        public string ActivityType { get; set; } = string.Empty; // نشاط الوحدة (تجاري، إداري، سكني)
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal AreaSize { get; set; } // مساحة الوحدة

        [Required, MaxLength(50)]
        public string Status { get; set; } = "شاغر"; // حالة الوحدة (شاغرة، مؤجرة، صيانة)

        [MaxLength(300)]
        public string? Description { get; set; } // ملاحظات على الوحدة

        // مفتاح أجنبي للعقار الأساسي (المبنى أو المجمع)
        public int PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public Property? Property { get; set; }

        // ربط جدول العقود (Contracts) بهذه الوحدة
        public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    }
}