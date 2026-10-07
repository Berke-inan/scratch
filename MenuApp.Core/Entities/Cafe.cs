namespace MenuApp.Core.Entities;

public class Cafe
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Category> Categories { get; set; } = new List<Category>();
}
