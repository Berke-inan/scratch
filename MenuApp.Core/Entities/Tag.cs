namespace MenuApp.Core.Entities;

public class Tag
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? TagType { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
