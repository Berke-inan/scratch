using System.Threading.RateLimiting;
using System.Text.Json.Serialization;
using FluentValidation;
using MenuApp.Core.DTOs;
using MenuApp.Core.Interfaces;
using MenuApp.Core.Validators;
using MenuApp.Infrastructure.Data;
using MenuApp.Infrastructure.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configure System.Text.Json to prevent circular references
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS for Next.js frontend (Vercel, local dev, and network access)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Entity Framework Core with Supabase PostgreSQL (Npgsql)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<MenuQueryDtoValidator>();

// Register AI Service, Taxonomy Registry & Menu Service
builder.Services.AddHttpClient<IAiService, GeminiAiService>();
builder.Services.AddSingleton<ITaxonomyRegistry, MenuApp.Infrastructure.Search.TaxonomyRegistry>();
builder.Services.AddScoped<IMenuService, MenuService>();

// Configure .NET 8 Rate Limiter (Token Bucket: 60 requests per minute per IP)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Dakikalık istek limitine ulaştınız. Lütfen daha sonra tekrar deneyiniz.",
            status = StatusCodes.Status429TooManyRequests
        }, cancellationToken: token);
    };

    // IP-based Token Bucket policy (60 tokens, replenished every 1 minute)
    options.AddPolicy("IpTokenBucketPolicy", httpContext =>
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? "anonymous";

        return RateLimitPartition.GetTokenBucketLimiter(ipAddress, _ => new TokenBucketRateLimiterOptions
        {
            TokenLimit = 60,
            TokensPerPeriod = 60,
            ReplenishmentPeriod = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });

    // Global limiter protecting all endpoints
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? "anonymous";

        return RateLimitPartition.GetTokenBucketLimiter(ipAddress, _ => new TokenBucketRateLimiterOptions
        {
            TokenLimit = 60,
            TokensPerPeriod = 60,
            ReplenishmentPeriod = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors("AllowAll");

// Enable Rate Limiter Middleware
app.UseRateLimiter();

// Health check endpoint
app.MapGet("/", () => Results.Ok(new
{
    Application = "MenuApp.Api",
    Status = "Healthy",
    Version = "1.0.0",
    RateLimiting = "Enabled (60 req/min per IP via Token Bucket)",
    Timestamp = DateTime.UtcNow
}))
.WithName("RootHealthCheck")
.WithOpenApi();

// Multi-tenant Welcome / Init Endpoint
app.MapGet("/api/menu/init", async (
    Guid cafeId,
    IMenuService menuService,
    CancellationToken ct) =>
{
    try
    {
        var initResult = await menuService.GetInitMessageAsync(cafeId, ct);
        return Results.Ok(initResult);
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
})
.WithName("InitMenu")
.RequireRateLimiting("IpTokenBucketPolicy")
.WithOpenApi();

// AI-powered Menu Search & Chat Endpoint (validated & rate-limited)
app.MapPost("/api/menu/search", async (
    MenuQueryDto dto,
    IValidator<MenuQueryDto> validator,
    IMenuService menuService,
    CancellationToken ct) =>
{
    var validationResult = await validator.ValidateAsync(dto, ct);
    if (!validationResult.IsValid)
    {
        return Results.ValidationProblem(validationResult.ToDictionary());
    }

    var result = await menuService.SearchMenuAsync(dto.Query, dto.CafeId, ct);
    return Results.Ok(result);
})
.WithName("SearchMenu")
.RequireRateLimiting("IpTokenBucketPolicy")
.WithOpenApi();

// AI Menu Query Endpoint (raw intent extraction test)
app.MapPost("/api/menu/ai-query", async (
    MenuQueryDto dto,
    IValidator<MenuQueryDto> validator,
    IAiService aiService,
    CancellationToken ct) =>
{
    var validationResult = await validator.ValidateAsync(dto, ct);
    if (!validationResult.IsValid)
    {
        return Results.ValidationProblem(validationResult.ToDictionary());
    }

    var result = await aiService.ProcessMenuQueryAsync(dto.Query, ct);
    return Results.Content(result, "application/json");
})
.WithName("ProcessMenuAiQuery")
.RequireRateLimiting("IpTokenBucketPolicy")
.WithOpenApi();

// Gemini Models List Endpoint (Google AI Studio hesabınızdaki aktif modelleri listeler)
app.MapGet("/api/menu/gemini-models", async (IConfiguration config, IHttpClientFactory httpClientFactory) =>
{
    var apiKey = config["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
    var client = httpClientFactory.CreateClient();
    using var request = new HttpRequestMessage(HttpMethod.Get, $"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}");
    request.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
    var res = await client.SendAsync(request);
    var content = await res.Content.ReadAsStringAsync();
    return Results.Content(content, "application/json");
})
.WithName("GetGeminiModels")
.WithOpenApi();

// Cafes endpoint
app.MapGet("/api/cafes", async (ApplicationDbContext db) =>
{
    var cafes = await db.Cafes
        .AsNoTracking()
        .ToListAsync();
    return Results.Ok(cafes);
})
.WithName("GetCafes")
.WithOpenApi();

// Categories endpoint
app.MapGet("/api/categories", async (ApplicationDbContext db) =>
{
    var categories = await db.Categories
        .AsNoTracking()
        .Select(c => new
        {
            c.Id,
            c.CafeId,
            c.Name,
            Products = c.Products.Select(p => new
            {
                p.Id,
                p.CategoryId,
                categoryName = c.Name,
                p.Name,
                p.Description,
                p.Price,
                p.IsAvailable,
                Tags = p.Tags.Select(t => t.Name).ToList()
            }).ToList()
        })
        .ToListAsync();
    return Results.Ok(categories);
})
.WithName("GetCategories")
.WithOpenApi();

// Products endpoint
app.MapGet("/api/products", async (ApplicationDbContext db) =>
{
    var products = await db.Products
        .AsNoTracking()
        .Select(p => new
        {
            p.Id,
            p.CategoryId,
            categoryName = p.Category != null ? p.Category.Name : "",
            p.Name,
            p.Description,
            p.Price,
            p.IsAvailable,
            Tags = p.Tags.Select(t => t.Name).ToList()
        })
        .ToListAsync();
    return Results.Ok(products);
})
.WithName("GetProducts")
.WithOpenApi();

app.Run();
