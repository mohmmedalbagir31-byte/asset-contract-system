using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetContractSystem.Models
{
    public class City
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // مفتاح أجنبي للولاية
        public int StateId { get; set; }

        [ForeignKey("StateId")]
        public State? State { get; set; }

        // العلاقة: المدينة الواحدة تحتوي على عدة عقارات/أصول
        public ICollection<Property> Properties { get; set; } = new List<Property>();
    }
}