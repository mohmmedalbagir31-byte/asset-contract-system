using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetContractSystem.Models
{
    public class Contract
    {
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string ContractNumber { get; set; } = string.Empty; // رقم العقد التعريفي

        [Required, MaxLength(100)]
        public string ContractType { get; set; } = string.Empty; // نوع العقد (عقد تشييد، إيجار عادي، إلخ)

        [Required, MaxLength(50)]
        public string Duration { get; set; } = string.Empty; // مدة العقد (مثلاً: سنة، 3 سنوات)

        [Column(TypeName = "decimal(18,2)")]
        public decimal ContractValue { get; set; } // قيمة العقد المالية الأساسية

        // القيمة المضافة أو العمولة (التي طلبتها مثل 500)
        [Column(TypeName = "decimal(18,2)")]
        public decimal Annex { get; set; } = 0; 

        [MaxLength(500)]
        public string? AnnexSummary { get; set; } // وصف وتفاصيل مبلغ الـ Annex (العمولة أو الرسوم)

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyRentValue { get; set; } // قيمة الإيجار الشهري

        // الخاصية المحسوبة لإجمالي العقد (القيمة الأساسية + العمولة)
        [NotMapped]
        public decimal TotalContractValue => ContractValue + Annex;

        public DateTime StartDate { get; set; } // تاريخ بداية العقد

        public DateTime EndDate { get; set; } // تاريخ نهاية العقد

        [MaxLength(1000)]
        public string? Summary { get; set; } // ملخص الاتفاق

        [Required, MaxLength(50)]
        public string Status { get; set; } = "ساري"; // حالة العقد (ساري، منتهي، ملغي)

        [MaxLength(100)]
        public string? CreatedBy { get; set; } // الموظف الذي أنشأ العقد

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- المفاتيح الخارجية (Relations) ---

        public int PropertyUnitId { get; set; }
        [ForeignKey("PropertyUnitId")]
        public PropertyUnit? PropertyUnit { get; set; }

        public int InvestorId { get; set; }
        [ForeignKey("InvestorId")]
        public Investor? Investor { get; set; }

        public int CityId { get; set; }
        [ForeignKey("CityId")]
        public City? City { get; set; }

        // العلاقة العكسية لجلب الدفعيات الخاصة بهذا العقد بسهولة
        public ICollection<ContractPayment>? Payments { get; set; }
    }
}