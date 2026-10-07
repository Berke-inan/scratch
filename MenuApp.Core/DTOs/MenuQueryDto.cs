namespace MenuApp.Core.DTOs;

public class MenuQueryDto
{
    public string Query { get; set; } = string.Empty;
    public Guid? CafeId { get; set; }
}
