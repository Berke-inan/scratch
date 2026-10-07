using FluentValidation;
using MenuApp.Core.DTOs;

namespace MenuApp.Core.Validators;

public class MenuQueryDtoValidator : AbstractValidator<MenuQueryDto>
{
    public MenuQueryDtoValidator()
    {
        RuleFor(x => x.Query)
            .NotEmpty().WithMessage("Sorgu boş olamaz.")
            .MaximumLength(150).WithMessage("Sorgu en fazla 150 karakter olabilir.");
    }
}
