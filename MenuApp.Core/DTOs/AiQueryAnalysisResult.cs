namespace MenuApp.Core.DTOs;

public class AiQueryAnalysisResult
{
    public string Intent { get; set; } = "chat";
    public string AiMessage { get; set; } = string.Empty;
    public string? Category { get; set; }
    public List<string> SearchKeywords { get; set; } = new();
    public List<string> ExcludeTags { get; set; } = new();
    public string PricePreference { get; set; } = "none"; // "cheap" | "expensive" | "none"
    public decimal? MaxPrice { get; set; }
    public decimal? MinPrice { get; set; }
}
