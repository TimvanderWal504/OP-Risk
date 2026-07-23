namespace RiskGame.Rules.State;

/// <summary>Hoe de gebieden bij de start verdeeld worden (FO §5.1).</summary>
public enum SetupMode
{
    /// <summary>De server verdeelt alle gebieden gelijkmatig willekeurig. Standaard.</summary>
    Random,

    /// <summary>Spelers claimen om beurten één leeg gebied tot alles verdeeld is.</summary>
    Claiming,
}
