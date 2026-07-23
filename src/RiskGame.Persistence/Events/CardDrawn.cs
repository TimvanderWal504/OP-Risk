namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler trekt 1 kaart nadat hij in zijn beurt minstens één gebied veroverde (FO
/// §5.2). De getrokken kaart ligt al vast — het schudden/kiezen uit de trekstapel is
/// server-side dobbelen (TO §4.2) en hoort bij de command-orchestratie van bouwstap 3, niet
/// bij deze vouwregel.
/// </summary>
public sealed record CardDrawn(string GameId, string PlayerId, string CardId);
