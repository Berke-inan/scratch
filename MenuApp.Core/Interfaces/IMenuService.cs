using MenuApp.Core.DTOs;

namespace MenuApp.Core.Interfaces;

public interface IMenuService
{
    Task<MenuSearchResultDto> SearchMenuAsync(string userQuery, Guid? cafeId = null, CancellationToken cancellationToken = default);
    Task<MenuInitDto> GetInitMessageAsync(Guid cafeId, CancellationToken cancellationToken = default);
}
