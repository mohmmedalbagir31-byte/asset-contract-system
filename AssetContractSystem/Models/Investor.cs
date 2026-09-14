using System.ComponentModel.DataAnnotations;

namespace AssetContractSystem.Models
{
    public class Investor
    {
        public int Id { get; set; }

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? Email { get; set; }

        [Required, MaxLength(50)]
        public string IdType { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string IdNumber { get; set; } = string.Empty;

        public DateTime? IssueDate { get; set; }

        public DateTime? ExpiryDate { get; set; }

        [MaxLength(100)]
        public string? IssuePlace { get; set; }

        public bool IsActive { get; set; } = true;

        // ربط المستثمر بالعقود الخاصة به (تمت إزالة التعليق)
        public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
    }
}