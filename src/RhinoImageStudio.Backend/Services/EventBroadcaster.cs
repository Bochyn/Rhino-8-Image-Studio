using System.Threading.Channels;
using RhinoImageStudio.Shared.Contracts;
using RhinoImageStudio.Shared.Enums;

namespace RhinoImageStudio.Backend.Services;

/// <summary>
/// Service for broadcasting job progress events via SSE
/// Uses JobDto to send full job state for proper frontend updates
/// </summary>
public interface IEventBroadcaster
{
    void Broadcast(JobDto jobDto);
    void BroadcastToProject(Guid projectId, JobDto jobDto);
    IAsyncEnumerable<JobDto> SubscribeAsync(CancellationToken cancellationToken);
    IAsyncEnumerable<JobDto> SubscribeToProjectAsync(Guid projectId, CancellationToken cancellationToken);
}

public class EventBroadcaster : IEventBroadcaster
{
    private readonly Channel<JobDto> _globalChannel;
    private readonly Dictionary<Guid, Channel<JobDto>> _projectChannels = new();
    private readonly object _lock = new();

    public EventBroadcaster()
    {
        _globalChannel = Channel.CreateUnbounded<JobDto>(new UnboundedChannelOptions
        {
            SingleReader = false,
            SingleWriter = false
        });
    }

    public void Broadcast(JobDto jobDto)
    {
        _globalChannel.Writer.TryWrite(jobDto);
    }

    public void BroadcastToProject(Guid projectId, JobDto jobDto)
    {
        // Broadcast to global channel
        Broadcast(jobDto);

        // Also broadcast to project-specific channel if exists
        lock (_lock)
        {
            if (_projectChannels.TryGetValue(projectId, out var channel))
            {
                channel.Writer.TryWrite(jobDto);
            }
        }
    }

    public async IAsyncEnumerable<JobDto> SubscribeAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var evt in _globalChannel.Reader.ReadAllAsync(cancellationToken))
        {
            yield return evt;
        }
    }

    public async IAsyncEnumerable<JobDto> SubscribeToProjectAsync(
        Guid projectId,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        Channel<JobDto> channel;

        lock (_lock)
        {
            if (!_projectChannels.TryGetValue(projectId, out channel!))
            {
                channel = Channel.CreateUnbounded<JobDto>();
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
