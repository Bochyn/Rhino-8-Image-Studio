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
    void BroadcastToProject(Guid projectId, JobProgressEvent progressEvent);
    IAsyncEnumerable<JobProgressEvent> SubscribeAsync(CancellationToken cancellationToken);
    IAsyncEnumerable<JobProgressEvent> SubscribeToProjectAsync(Guid projectId, CancellationToken cancellationToken);
}

public class EventBroadcaster : IEventBroadcaster
{
    private readonly Channel<JobProgressEvent> _globalChannel;
    private readonly Dictionary<Guid, Channel<JobProgressEvent>> _projectChannels = new();
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

    public void BroadcastToProject(Guid projectId, JobProgressEvent progressEvent)
    {
        // Broadcast to global channel
        Broadcast(progressEvent);

        // Also broadcast to project-specific channel if exists
        lock (_lock)
        {
            if (_projectChannels.TryGetValue(projectId, out var channel))
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

    public async IAsyncEnumerable<JobProgressEvent> SubscribeToProjectAsync(
        Guid projectId,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        Channel<JobProgressEvent> channel;

        lock (_lock)
        {
            if (!_projectChannels.TryGetValue(projectId, out channel!))
            {
                channel = Channel.CreateUnbounded<JobProgressEvent>();
                _projectChannels[projectId] = channel;
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
                _projectChannels.Remove(projectId);
            }
        }
    }
}
