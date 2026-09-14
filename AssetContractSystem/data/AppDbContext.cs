using Microsoft.EntityFrameworkCore;
using AssetContractSystem.Models;

namespace AssetContractSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Sector> Sectors { get; set; }
        public DbSet<State> States { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<Owner> Owners { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<PropertyUnit> PropertyUnits { get; set; }
        public DbSet<Investor> Investors { get; set; }
        public DbSet<Contract> Contracts { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<ContractPayment> ContractPayments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // حل مشكلة المسارات المتعددة للحذف (Multiple Cascade Paths) في جدول العقود
            modelBuilder.Entity<Contract>()
                .HasOne(c => c.City)
                .WithMany()
                .HasForeignKey(c => c.CityId)
                .OnDelete(DeleteBehavior.Restrict); // منع الحذف المتتالي التلقائي لتجنب التعارض
        }
    }
}