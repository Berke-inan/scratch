namespace MenuApp.Core.Entities;

public class Category
{
    public Guid Id { get; set; }
    public Guid CafeId { get; set; }
    public string Name { get; set; } = string.Empty;

    public Cafe? Cafe { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
