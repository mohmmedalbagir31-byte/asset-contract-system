using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssetContractSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddContractFinancialDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Annex",
                table: "Contracts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(string),
                oldType: "nvarchar(3000)",
                oldMaxLength: 3000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AnnexSummary",
                table: "Contracts",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyRentValue",
                table: "Contracts",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnnexSummary",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "MonthlyRentValue",
                table: "Contracts");

            migrationBuilder.AlterColumn<string>(
                name: "Annex",
                table: "Contracts",
                type: "nvarchar(3000)",
                maxLength: 3000,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");
        }
    }
}
