import { useState, useEffect } from 'react';
import { api, ConfigInfo } from '@/lib/api';
import { Button } from '@/components/Common/Button';
import { Label } from '@/components/Common/Label';
import { Card } from '@/components/Common/Card';
import { X, Key, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.config.get();
      setConfig(data);
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.config.setApiKey(apiKey.trim());
      setSuccess(true);
      setApiKey(''); // Clear the input after saving
      await loadConfig(); // Refresh config
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-background border rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* API Key Section */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">fal.ai API Key</Label>
                </div>

                {/* Current Status */}
                <div className="flex items-center gap-2 mb-3">
                  {config?.hasApiKey ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">API key configured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">No API key set</span>
                    </>
                  )}
                </div>

                {/* API Key Input */}
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder={config?.hasApiKey ? 'Enter new API key to update...' : 'Enter your fal.ai API key...'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleSaveApiKey}
                    disabled={saving || !apiKey.trim()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save API Key'
                    )}
                  </Button>
                </div>

                {/* Get API Key Link */}
                <a
                  href="https://fal.ai/dashboard/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                >
                  Get your API key at fal.ai
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>

              {/* Data Path Info */}
              {config && (
                <Card className="p-4">
                  <Label className="text-xs text-muted-foreground">Data Location</Label>
                  <p className="text-sm font-mono break-all">{config.dataPath}</p>
                </Card>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  API key saved successfully!
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
