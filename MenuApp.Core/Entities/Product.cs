namespace MenuApp.Core.Entities;

public class Product
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;

    public Category? Category { get; set; }
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
