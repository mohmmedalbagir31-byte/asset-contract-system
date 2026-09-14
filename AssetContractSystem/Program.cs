using System.Text;
using AssetContractSystem.Data;
using AssetContractSystem.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. ربط قاعدة البيانات لتعمل مع MySQL (تدعم Railway محلياً وسحابياً)
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                           ?? Environment.GetEnvironmentVariable("MYSQL_URL");

    options.UseMySql(
        connectionString, 
        ServerVersion.AutoDetect(connectionString),
        mySqlOptions =>
        {
            mySqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
});

// --- إعداد الـ JWT Authentication ---
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!))
    };
});

builder.Services.AddAuthorization();

// 2. تفعيل خدمة الـ Controllers للتعامل مع الـ APIs
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Add services to the container.
builder.Services.AddOpenApi();

// إضافة إعدادات الـ CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5210", "https://localhost:7150")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// --- تهيئة قاعدة البيانات وإنشاء حساب المشرف الافتراضي تلقائياً ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        // تطبيق أي Migrations معلقة على قاعدة بيانات MySQL
        context.Database.Migrate();

        // التحقق مما إذا كان المستخدم "admin" موجوداً مسبقاً
        if (!context.Users.Any(u => u.Username == "admin"))
        {
            var adminUser = new User
            {
                Username = "admin",
                FullName = "مدير النظام",
                PasswordHash = "123456",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(adminUser);
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        // طباعة تفاصيل الخطأ كاملة لكي تظهر في الـ Logs
        logger.LogError(ex, "حدث خطأ أثناء إنشاء حساب المشرف الافتراضي: {Message}", ex.ToString());
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// --- 3. تفعيل الملفات الثابتة (لخدمة ملفات الـ React من wwwroot) ---
app.UseStaticFiles();

// تفعيل سياسة الـ CORS
app.UseCors("AllowFrontend");

// --- 4. تفعيل المصادقة والصلاحيات ---
app.UseAuthentication();
app.UseAuthorization();

// 5. تفعيل مسارات الـ Controllers
app.MapControllers();

// --- 6. توجيه باقي المسارات لواجهة React (SPA Fallback) ---
app.MapFallbackToFile("index.html");

// مسار تجريبي افتراضي (اختياري)
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}