using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

public sealed class TvDisplayGuardsTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    [InlineData(50)]
    [InlineData(100)]
    public void ValuesAreValid_SchaalwaardeOpEenStapBinnenHetBereik_IsGeldig(int value)
    {
        var settings = new TvDisplaySettings(value, value, value, TvLanguage.En, value);

        Assert.True(TvDisplayGuards.ValuesAreValid(settings).IsSuccess);
    }

    [Theory]
    [InlineData(-5)]
    [InlineData(105)]
    [InlineData(7)]
    public void ValuesAreValid_TekstschaalBuitenBereikOfNietOpEenStap_IsOngeldig(int value) =>
        AssertInvalid(TvDisplaySettings.Default with { TextScale = value });

    [Theory]
    [InlineData(-5)]
    [InlineData(105)]
    [InlineData(7)]
    public void ValuesAreValid_GlasdekkingBuitenBereikOfNietOpEenStap_IsOngeldig(int value) =>
        AssertInvalid(TvDisplaySettings.Default with { GlassOpacity = value });

    [Theory]
    [InlineData(-5)]
    [InlineData(105)]
    [InlineData(7)]
    public void ValuesAreValid_GlasblurBuitenBereikOfNietOpEenStap_IsOngeldig(int value) =>
        AssertInvalid(TvDisplaySettings.Default with { GlassBlur = value });

    [Theory]
    [InlineData(-5)]
    [InlineData(105)]
    [InlineData(7)]
    public void ValuesAreValid_DobbelsteenschaalBuitenBereikOfNietOpEenStap_IsOngeldig(int value) =>
        AssertInvalid(TvDisplaySettings.Default with { DiceScale = value });

    [Fact]
    public void ValuesAreValid_OnbekendeTaal_IsOngeldig() =>
        AssertInvalid(TvDisplaySettings.Default with { Language = (TvLanguage)99 });

    [Fact]
    public void Default_IsHetDesignOpAlleSchalenInHetNederlands() =>
        Assert.Equal(new TvDisplaySettings(50, 50, 50, TvLanguage.Nl, 50), TvDisplaySettings.Default);

    private static void AssertInvalid(TvDisplaySettings settings)
    {
        var result = TvDisplayGuards.ValuesAreValid(settings);

        Assert.False(result.IsSuccess);
        Assert.Equal("tvDisplay.invalidValue", Assert.Single(result.Errors).Code);
    }
}
