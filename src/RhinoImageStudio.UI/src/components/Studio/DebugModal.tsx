import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { GenerationDebugInfo } from '@/lib/types';
import { X, Bug, Loader2, Copy, Check, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  generationId: string | null;
}

export function DebugModal({ isOpen, onClose, generationId }: DebugModalProps) {
  const [debugInfo, setDebugInfo] = useState<GenerationDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && generationId) {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      setCopied(false);
      setShowRawJson(false);

      api.generations.getDebugInfo(generationId)
        .then((data) => {
          setDebugInfo(data);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load debug info');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, generationId]);

  const handleCopyJson = async () => {
    if (!debugInfo) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-panel border border-border rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-panel rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-primary">Request Debug</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-card transition-colors"
          >
            <X className="h-4 w-4 text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {debugInfo && !showRawJson && (
            <>
              {/* Prompt */}
              <Section label="Prompt">
                <pre className="text-sm text-primary bg-card rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-mono border border-border">
                  {debugInfo.prompt || '(empty)'}
                </pre>
              </Section>

              {/* Model */}
              <Section label="Model">
                <Value>{debugInfo.model || '(unknown)'}</Value>
              </Section>

              {/* Settings */}
              <Section label="Settings">
                <div className="grid grid-cols-2 gap-2">
                  <KeyValue label="Aspect Ratio" value={debugInfo.aspectRatio || '-'} />
                  <KeyValue label="Resolution" value={debugInfo.resolution || '-'} />
                  <KeyValue label="Output Format" value={debugInfo.outputFormat || '-'} />
                  <KeyValue label="Num Images" value={String(debugInfo.numImages ?? '-')} />
                </div>
              </Section>

              {/* Source */}
              <Section label="Source">
                <div className="grid grid-cols-2 gap-2">
                  <KeyValue label="Type" value={debugInfo.sourceType || '-'} />
                  <KeyValue label="ID" value={debugInfo.sourceId ? truncateId(debugInfo.sourceId) : '-'} />
                </div>
              </Section>

              {/* References */}
              <Section label="References">
                <Value>
                  {debugInfo.referenceCount > 0
                    ? `${debugInfo.referenceCount} reference(s)`
                    : 'None'}
                </Value>
                {debugInfo.referenceDetails && debugInfo.referenceDetails.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {debugInfo.referenceDetails.map((ref, i) => (
                      <ReferenceRow key={ref.id} index={i} ref_={ref} />
                    ))}
                  </div>
                )}
              </Section>

              {/* Masks */}
              {debugInfo.masks && debugInfo.masks.length > 0 && (
                <Section label={`Masks (${debugInfo.masks.length})`}>
                  <div className="space-y-1.5">
                    {debugInfo.masks.map((mask, i) => (
                      <MaskRow key={i} mask={mask} index={i} generationId={generationId!} />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* Raw JSON view */}
          {debugInfo && showRawJson && (
            <pre className="text-xs text-primary bg-card rounded-lg p-3 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all font-mono border border-border">
              {formatRawJson(debugInfo.rawJson)}
            </pre>
          )}
        </div>

        {/* Footer */}
        {debugInfo && (
          <div className="flex justify-end gap-2 p-4 border-t border-border sticky bottom-0 bg-panel rounded-b-2xl">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                showRawJson
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-primary border-border hover:bg-card-hover"
              )}
            >
              <Code className="h-3.5 w-3.5" />
              {showRawJson ? 'Details' : 'View JSON'}
            </button>
            <button
              onClick={handleCopyJson}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                copied
                  ? "bg-green-500/10 text-green-500 border-green-500/30"
                  : "bg-card text-primary border-border hover:bg-card-hover"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Helper components --

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-primary">{children}</p>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-md px-2 py-1.5 border border-border">
      <p className="text-[10px] text-secondary">{label}</p>
      <p className="text-xs text-primary font-mono truncate" title={value}>{value}</p>
    </div>
  );
}

function ReferenceRow({ index, ref_ }: { index: number; ref_: { id: string; fileName: string; thumbnailUrl?: string } }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative flex items-center gap-2 group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <p className="text-xs text-accent font-mono">
        [{index}] {truncateId(ref_.id)}
      </p>
      <span className="text-[10px] text-secondary truncate max-w-[180px]" title={ref_.fileName}>
        {ref_.fileName}
      </span>

      {/* Tooltip with thumbnail */}
      {showTooltip && ref_.thumbnailUrl && (
        <div className="absolute left-0 bottom-full mb-1.5 z-20 bg-card border border-border rounded-lg p-1.5 shadow-lg">
          <img
            src={ref_.thumbnailUrl}
            alt={ref_.fileName}
            className="w-16 h-16 object-cover rounded"
          />
          <p className="text-[10px] text-secondary mt-1 max-w-[120px] truncate">{ref_.fileName}</p>
        </div>
      )}
    </div>
  );
}

function MaskRow({ mask, index, generationId }: {
  mask: { index: number; instruction: string; imageSize: string };
  index: number;
  generationId: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative bg-card rounded-lg p-2.5 border border-border"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <p className="text-sm text-primary break-words">
        {mask.instruction || '(no instruction)'}
      </p>
      <p className="text-[10px] text-secondary mt-1 font-mono">
        #{mask.index} · {mask.imageSize}
      </p>

      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-1.5 z-20 bg-card border border-border rounded-lg p-1.5 shadow-lg">
          <img
            src={`/api/generations/${generationId}/masks/${index}/image`}
            alt={`Mask ${mask.index}`}
            className="w-16 h-16 object-contain rounded bg-black"
          />
        </div>
      )}
    </div>
  );
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function formatRawJson(rawJson?: string): string {
  if (!rawJson) return '(no raw JSON available)';
  try {
    return JSON.stringify(JSON.parse(rawJson), null, 2);
  } catch {
    return rawJson;
  }
}
