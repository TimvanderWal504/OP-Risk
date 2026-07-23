using Microsoft.Extensions.Logging;

namespace RiskGame.Api.Tests;

public sealed record CapturedLogEntry(string Category, LogLevel Level, string Message);

/// <summary>Vangt log-entries op in-memory zodat een test kan bewijzen dat er iets gelogd is.</summary>
public sealed class CapturingLoggerProvider : ILoggerProvider
{
    private readonly List<CapturedLogEntry> _entries = [];

    public IReadOnlyList<CapturedLogEntry> Entries
    {
        get
        {
            lock (_entries)
            {
                return [.. _entries];
            }
        }
    }

    public ILogger CreateLogger(string categoryName) => new CapturingLogger(categoryName, this);

    public void Dispose()
    {
    }

    private void Add(CapturedLogEntry entry)
    {
        lock (_entries)
        {
            _entries.Add(entry);
        }
    }

    private sealed class CapturingLogger(string categoryName, CapturingLoggerProvider owner) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) =>
            owner.Add(new CapturedLogEntry(categoryName, logLevel, formatter(state, exception)));
    }
}
