namespace RiskGame.Rules.State;

/// <summary>De fase waarin het spel als geheel verkeert (TO §3.1).</summary>
public enum GamePhase
{
    /// <summary>Spelers sluiten aan en kiezen een kleur; de host stelt in.</summary>
    Lobby,

    /// <summary>Iedereen werpt om de spelersvolgorde te bepalen.</summary>
    OrderRoll,

    /// <summary>Spelers claimen om beurten een leeg gebied (alleen bij <see cref="SetupMode.Claiming"/>).</summary>
    Claiming,

    /// <summary>
    /// Resterende startlegers worden bijgeplaatst (FO §5.1): om beurten bij
    /// <see cref="SetupMode.Claiming"/>, gelijktijdig (geen beurt) bij <see cref="SetupMode.Random"/>.
    /// </summary>
    InitialPlacement,

    /// <summary>Het eigenlijke spel: beurten van Versterken, Aanvallen en Verplaatsen.</summary>
    InProgress,

    /// <summary>Er is een winnaar; alleen herstart-acties zijn nog geldig (FO §7).</summary>
    Finished,
}
