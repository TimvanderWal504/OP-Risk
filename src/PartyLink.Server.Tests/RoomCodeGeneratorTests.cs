using PartyLink.Server.Rooms;

namespace PartyLink.Server.Tests;

public sealed class RoomCodeGeneratorTests
{
    [Fact]
    public void NewCode_HasTheFixedLengthAndOnlyAlphabetCharacters()
    {
        for (var i = 0; i < 1_000; i++)
        {
            var code = RoomCodeGenerator.NewCode();

            Assert.Equal(RoomCodeGenerator.Length, code.Length);
            Assert.All(code, character => Assert.Contains(character, RoomCodeGenerator.Alphabet));
        }
    }

    /// <summary>Not a randomness test — only a guard against a generator that keeps returning the same code.</summary>
    [Fact]
    public void NewCode_ProducesDifferentCodes()
    {
        var codes = Enumerable.Range(0, 1_000).Select(_ => RoomCodeGenerator.NewCode()).ToHashSet();

        Assert.True(codes.Count > 990);
    }
}
