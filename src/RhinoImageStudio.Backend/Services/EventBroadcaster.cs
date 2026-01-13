using System.Threading.Channels;
using RhinoImageStudio.Shared.Contracts;
using RhinoImageStudio.Shared.Enums;

namespace RhinoImageStudio.Backend.Services;

/// <summary>
/// Service for broadcasting job progress events via SSE
/// </summary>
public interface IEventBroadcaster
{
    void Broadcast(JobProgressEvent progressEvent);
    void BroadcastToSession(Guid sessionId, JobProgressEvent progressEvent);
    IAsyncEnumerable<JobProgressEvent> SubscribeAsync(CancellationToken cancellationToken);
    IAsyncEnumerable<JobProgressEvent> SubscribeToSessionAsync(Guid sessionId, CancellationToken cancellationToken);
}

public class EventBroadcaster : IEventBroadcaster
{
    private readonly Channel<JobProgressEvent> _globalChannel;
    private readonly Dictionary<Guid, Channel<JobProgressEvent>> _sessionChannels = new();
    private readonly object _lock = new();

    public EventBroadcaster()
    {
        _globalChannel = Channel.CreateUnbounded<JobProgressEvent>(new UnboundedChannelOptions
        {
            SingleReader = false,
            SingleWriter = false
        });
    }

    public void Broadcast(JobProgressEvent progressEvent)
    {
        _globalChannel.Writer.TryWrite(progressEvent);
    }

    public void BroadcastToSession(Guid sessionId, JobProgressEvent progressEvent)
    {
        // Broadcast to global channel
        Broadcast(progressEvent);

        // Also broadcast to session-specific channel if exists
        lock (_lock)
        {
            if (_sessionChannels.TryGetValue(sessionId, out var channel))
            {
                channel.Writer.TryWrite(progressEvent);
            }
        }
    }

    public async IAsyncEnumerable<JobProgressEvent> SubscribeAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var evt in _globalChannel.Reader.ReadAllAsync(cancellationToken))
        {
            yield return evt;
        }
    }

    public async IAsyncEnumerable<JobProgressEvent> SubscribeToSessionAsync(
        Guid sessionId,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        Channel<JobProgressEvent> channel;

        lock (_lock)
        {
            if (!_sessionChannels.TryGetValue(sessionId, out channel!))
            {
                channel = Channel.CreateUnbounded<JobProgressEvent>();
                _sessionChannels[sessionId] = channel;
            }
        }

        try
        {
            await foreach (var evt in channel.Reader.ReadAllAsync(cancellationToken))
            {
                yield return evt;
            }
        }
        finally
        {
            // Cleanup on disconnect
            lock (_lock)
            {
                // Only remove if no other readers (simplified - in production use ref counting)
                _sessionChannels.Remove(sessionId);
            }
        }
    }
}
