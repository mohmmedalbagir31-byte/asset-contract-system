using System.ComponentModel.DataAnnotations;

namespace AssetContractSystem.Models
{
    public class Sector
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // العلاقة: القطاع الواحد يضم عدة ولايات
        public ICollection<State> States { get; set; } = new List<State>();
    }
}