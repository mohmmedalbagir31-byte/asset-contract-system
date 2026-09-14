using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AssetContractSystem.Models
{
    public class State
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // مفتاح أجنبي للقطاع
        public int SectorId { get; set; }
        
        [ForeignKey("SectorId")]
        public Sector? Sector { get; set; }

        // العلاقة: الولاية الواحدة تضم عدة مدن مباشرة
        public ICollection<City> Cities { get; set; } = new List<City>();
    }
}