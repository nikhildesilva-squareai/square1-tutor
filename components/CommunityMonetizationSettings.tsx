'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

interface MonetizationSettings {
  id?: string;
  community_id: string;
  is_monetized: boolean;
  is_free: boolean;
  monthly_price: number | null;
  annual_price: number | null;
  allow_free_tier: boolean;
  currency: string;
}

export function CommunityMonetizationSettings() {
  const params = useParams();
  const communityId = params.id as string;

  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<'free' | 'paid' | 'both'>('free');

  useEffect(() => {
    fetchSettings();
  }, [communityId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/monetization/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');

      const data = await res.json();
      setSettings(data);

      // Determine tier mode
      if (data.is_monetized && !data.is_free) {
        setTiers('paid');
      } else if (data.is_monetized && data.is_free && data.allow_free_tier) {
        setTiers('both');
      } else {
        setTiers('free');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      setSettings({
        community_id: communityId,
        is_monetized: false,
        is_free: true,
        monthly_price: null,
        annual_price: null,
        allow_free_tier: true,
        currency: 'USD',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const payload = {
        is_monetized: tiers !== 'free',
        is_free: tiers === 'free' || tiers === 'both',
        monthly_price: tiers !== 'free' ? settings.monthly_price : null,
        annual_price: settings.annual_price,
        allow_free_tier: tiers === 'both',
      };

      const res = await fetch(
        `/api/communities/${communityId}/monetization/settings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const updated = await res.json();
      setSettings(updated);
      toast.success('Monetization settings saved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-6 text-center text-red-600">Error loading settings</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Monetization Settings</h2>
        <p className="text-gray-600 mb-6">Configure how your community generates revenue.</p>
      </div>

      {/* Tier Selection */}
      <div className="space-y-3">
        <label className="text-lg font-semibold">Community Model</label>

        <div className="space-y-2">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            onClick={() => setTiers('free')}>
            <input
              type="radio"
              checked={tiers === 'free'}
              readOnly
              className="mr-3 w-4 h-4"
            />
            <div>
              <div className="font-medium">Free Community</div>
              <div className="text-sm text-gray-600">No paid subscriptions</div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            onClick={() => setTiers('paid')}>
            <input
              type="radio"
              checked={tiers === 'paid'}
              readOnly
              className="mr-3 w-4 h-4"
            />
            <div>
              <div className="font-medium">Paid Only</div>
              <div className="text-sm text-gray-600">Users must pay to join</div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            onClick={() => setTiers('both')}>
            <input
              type="radio"
              checked={tiers === 'both'}
              readOnly
              className="mr-3 w-4 h-4"
            />
            <div>
              <div className="font-medium">Free + Paid Tiers</div>
              <div className="text-sm text-gray-600">Free access + premium tier for power users</div>
            </div>
          </label>
        </div>
      </div>

      {/* Pricing */}
      {tiers !== 'free' && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <label className="text-lg font-semibold">Pricing</label>

          <div>
            <label className="block text-sm font-medium mb-1">
              Monthly Price (USD)
            </label>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={settings.monthly_price || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    monthly_price: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Minimum $1.00"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <span className="text-gray-600 ml-2">/month</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Minimum $1.00 required</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Annual Price (USD) - Optional
            </label>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">$</span>
              <input
                type="number"
                min="12"
                step="0.01"
                value={settings.annual_price || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    annual_price: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Minimum $12.00"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <span className="text-gray-600 ml-2">/year</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Minimum $12.00 required</p>
          </div>

          {/* Revenue Split Info */}
          <div className="p-3 bg-white rounded border-l-4 border-green-500">
            <p className="text-sm font-medium mb-2">Revenue Split</p>
            <div className="flex justify-between text-sm">
              <span>You earn (90%)</span>
              <span className="font-semibold">
                {settings.monthly_price
                  ? `$${(settings.monthly_price * 0.9).toFixed(2)}/month`
                  : '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Platform takes (10%)</span>
              <span>
                {settings.monthly_price
                  ? `$${(settings.monthly_price * 0.1).toFixed(2)}/month`
                  : '--'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Info Box */}
      <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
        <p className="font-medium mb-2">📋 How it works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Set your pricing — we charge your members on Stripe</li>
          <li>You receive 90% of all subscription revenue</li>
          <li>Payouts happen monthly (minimum $500 threshold)</li>
          <li>Users can switch plans or cancel anytime</li>
          <li>Free tier members can always access (if enabled)</li>
        </ul>
      </div>
    </div>
  );
}
