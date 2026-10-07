namespace MenuApp.Infrastructure.Services;

public interface IAiService
{
    Task<string> ProcessMenuQueryAsync(string userQuery, CancellationToken cancellationToken = default);
    Task<string> GenerateWelcomeMessageAsync(string cafeName, CancellationToken cancellationToken = default);
}
