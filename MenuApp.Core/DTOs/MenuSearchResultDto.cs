namespace MenuApp.Core.DTOs;

public class MenuSearchResultDto
{
    public string Message { get; set; } = string.Empty;
    public List<ProductDto> Products { get; set; } = new();
}
