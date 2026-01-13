import { useState, useEffect } from 'react';
import { api, ConfigInfo } from '@/lib/api';
import { Button } from '@/components/Common/Button';
import { Label } from '@/components/Common/Label';
import { Card } from '@/components/Common/Card';
import { X, Key, CheckCircle, AlertCircle, Loader2, ExternalLink, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [falApiKey, setFalApiKey] = useState('');
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingGemini, setSavingGemini] = useState(false);
  const [savingFal, setSavingFal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successGemini, setSuccessGemini] = useState(false);
  const [successFal, setSuccessFal] = useState(false);

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

  const handleSaveGeminiApiKey = async () => {
    if (!geminiApiKey.trim()) {
      setError('Please enter a Gemini API key');
      return;
    }

    setSavingGemini(true);
    setError(null);
    setSuccessGemini(false);

    try {
      await api.config.setGeminiApiKey(geminiApiKey.trim());
      setSuccessGemini(true);
      setGeminiApiKey('');
      await loadConfig();
      setTimeout(() => setSuccessGemini(false), 3000);
    } catch (err) {
      setError('Failed to save Gemini API key');
    } finally {
      setSavingGemini(false);
    }
  };

  const handleSaveFalApiKey = async () => {
    if (!falApiKey.trim()) {
      setError('Please enter a fal.ai API key');
      return;
    }

    setSavingFal(true);
    setError(null);
    setSuccessFal(false);

    try {
      await api.config.setFalApiKey(falApiKey.trim());
      setSuccessFal(true);
      setFalApiKey('');
      await loadConfig();
      setTimeout(() => setSuccessFal(false), 3000);
    } catch (err) {
      setError('Failed to save fal.ai API key');
    } finally {
      setSavingFal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Gemini API Key Section - PRIMARY */}
              <Card className="p-4 bg-gray-800/50 border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <Label className="text-sm font-medium text-gray-100">Gemini API Key</Label>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Primary</span>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  Nano Banana (gemini-2.5-flash-image) - Fast, high-quality image generation
                </p>

                {/* Current Status */}
                <div className="flex items-center gap-2 mb-3">
                  {config?.hasGeminiApiKey ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400">API key configured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-500">No API key set</span>
                    </>
                  )}
                </div>

                {/* API Key Input */}
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder={config?.hasGeminiApiKey ? 'Enter new key to update...' : 'Enter your Gemini API key...'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-600 bg-gray-800 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700" 
                    onClick={handleSaveGeminiApiKey}
                    disabled={savingGemini || !geminiApiKey.trim()}
                  >
                    {savingGemini ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Gemini API Key'
                    )}
                  </Button>
                </div>

                {successGemini && (
                  <div className="flex items-center gap-2 mt-2 text-emerald-400 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    API key saved successfully!
                  </div>
                )}

                {/* Get API Key Link */}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-3"
                >
                  Get your API key at Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>

              {/* fal.ai API Key Section - SECONDARY */}
              <Card className="p-4 bg-gray-800/50 border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="h-4 w-4 text-sky-400" />
                  <Label className="text-sm font-medium text-gray-100">fal.ai API Key</Label>
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">Optional</span>
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  Required for Multi-Angle and Upscale features (Qwen, Topaz)
                </p>

                {/* Current Status */}
                <div className="flex items-center gap-2 mb-3">
                  {config?.hasFalApiKey ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-sky-400" />
                      <span className="text-sm text-sky-400">API key configured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">No API key set</span>
                    </>
                  )}
                </div>

                {/* API Key Input */}
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder={config?.hasFalApiKey ? 'Enter new key to update...' : 'Enter your fal.ai API key...'}
                    value={falApiKey}
                    onChange={(e) => setFalApiKey(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-600 bg-gray-800 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleSaveFalApiKey}
                    disabled={savingFal || !falApiKey.trim()}
                  >
                    {savingFal ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save fal.ai API Key'
                    )}
                  </Button>
                </div>

                {successFal && (
                  <div className="flex items-center gap-2 mt-2 text-sky-400 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    API key saved successfully!
                  </div>
                )}

                {/* Get API Key Link */}
                <a
                  href="https://fal.ai/dashboard/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-sky-400 hover:underline mt-3"
                >
                  Get your API key at fal.ai
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>

              {/* Data Path Info */}
              {config && (
                <Card className="p-4 bg-gray-800/30 border-gray-700">
                  <Label className="text-xs text-gray-500">Data Location</Label>
                  <p className="text-sm font-mono text-gray-400 break-all">{config.dataPath}</p>
                </Card>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
