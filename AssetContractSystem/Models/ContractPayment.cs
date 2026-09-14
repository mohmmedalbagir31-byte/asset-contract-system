using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetContractSystem.Models
{
    public class ContractPayment
    {
        public int Id { get; set; }

        [Required]
        public int ContractId { get; set; } // ربط الدفعة بالعقد الأساسي

        [ForeignKey("ContractId")]
        public Contract? Contract { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; } // المبلغ المدفوع في هذه الحركة

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow; // تاريخ السداد

        [Required, MaxLength(50)]
        public string PaymentType { get; set; } = "دفعة شهرية"; // نوع الدفعة (دفعة مقدمة، إيجار شهري، رسوم صيانة، إلخ)

        [Required, MaxLength(50)]
        public string PaymentMethod { get; set; } = "نقدي"; // طريقة الدفع (نقدي، تحويل بنكي، شيك، شبكة)

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; } // رقم الإيصال أو رقم الحوالة البنكية

        [MaxLength(300)]
        public string? Notes { get; set; } // ملاحظات إضافية

        [MaxLength(100)]
        public string? CreatedBy { get; set; } // اسم الموظف الذي استلم المبلغ وسجله
    }
}