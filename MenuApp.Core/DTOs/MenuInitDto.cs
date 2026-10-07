namespace MenuApp.Core.DTOs;

public class MenuInitDto
{
    public Guid CafeId { get; set; }
    public string CafeName { get; set; } = string.Empty;
    public string WelcomeMessage { get; set; } = string.Empty;
}
