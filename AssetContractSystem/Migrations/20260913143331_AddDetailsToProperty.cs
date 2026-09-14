using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssetContractSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddDetailsToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Details",
                table: "Properties",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Details",
                table: "Properties");
        }
    }
}
