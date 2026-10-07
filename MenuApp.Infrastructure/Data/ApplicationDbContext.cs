using MenuApp.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace MenuApp.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Cafe> Cafes => Set<Cafe>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Tag> Tags => Set<Tag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // cafes tablosu (snake_case)
        modelBuilder.Entity<Cafe>(entity =>
        {
            entity.ToTable("cafes");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.Name).HasColumnName("name").IsRequired().HasMaxLength(150);

            entity.HasMany(c => c.Categories)
                  .WithOne(cat => cat.Cafe)
                  .HasForeignKey(cat => cat.CafeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // categories tablosu (snake_case)
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.CafeId).HasColumnName("cafe_id");
            entity.Property(c => c.Name).HasColumnName("name").IsRequired().HasMaxLength(100);

            entity.HasMany(c => c.Products)
                  .WithOne(p => p.Category)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // products tablosu (snake_case)
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasColumnName("id");
            entity.Property(p => p.CategoryId).HasColumnName("category_id");
            entity.Property(p => p.Name).HasColumnName("name").IsRequired().HasMaxLength(150);
            entity.Property(p => p.Description).HasColumnName("description").HasMaxLength(1000);
            entity.Property(p => p.Price).HasColumnName("price").HasPrecision(18, 2);
            entity.Property(p => p.IsAvailable).HasColumnName("is_available").HasDefaultValue(true);

            // product_tags (Many-to-Many Join Table)
            entity.HasMany(p => p.Tags)
                  .WithMany(t => t.Products)
                  .UsingEntity<Dictionary<string, object>>(
                      "product_tags",
                      r => r.HasOne<Tag>().WithMany().HasForeignKey("tag_id"),
                      l => l.HasOne<Product>().WithMany().HasForeignKey("product_id"),
                      j =>
                      {
                          j.ToTable("product_tags");
                          j.IndexerProperty<Guid>("product_id").HasColumnName("product_id");
                          j.IndexerProperty<Guid>("tag_id").HasColumnName("tag_id");
                      });
        });

        // tags tablosu (snake_case)
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.ToTable("tags");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(t => t.TagType).HasColumnName("tag_type").HasMaxLength(50);
        });
    }
}
