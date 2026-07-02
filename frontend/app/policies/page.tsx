'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import TopNav from '@/components/app/TopNav'

// ... (unchanged types and constants)

const api = (method: string, path: string, body?: any) => {
  const { user } = usePrivy();
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': user?.id,
  };

  return fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    });
}

export default function PoliciesPage() {
  // ... (unchanged state and effects)

  async function load() {
    setLoading(true);
    try {
      const { policies } = await api('GET', '/api/policies');
      setPolicies(policies);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createPolicy() {
    if (!draft.name || saving) return;
    setSaving(true);
    try {
      const { policy } = await api('POST', '/api/policies', {
        name: draft.name,
        trigger: draft.trigger,
        action: draft.action,
        conditions: buildConditions(draft),
      });
      setPolicies((prev) => [policy, ...prev]);
      setShowNew(false);
      setDraft(BLANK);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function togglePolicy(id: string, enabled: boolean) {
    setPolicies((prev) => prev.map((p) => p.id === id ? { ...p, enabled } : p));
    try {
      await api('PATCH', `/api/policies/${id}`, { enabled });
    } catch (error) {
      console.error(error);
    }
  }

  async function deletePolicy(id: string) {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    try {
      await api('DELETE', `/api/policies/${id}`);
    } catch (error) {
      console.error(error);
    }
  }

  async function evaluate() {
    if (evaluating) return;
    setEvaluating(true);
    setEvalResults(null);
    try {
      const { results } = await api('POST', '/api/policies/evaluate', { apply: false });
      setEvalResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setEvaluating(false);
    }
  }

  async function applyPolicies() {
    if (applying || !evalResults) return;
    setApplying(true);
    try {
      await api('POST', '/api/policies/evaluate', { apply: true });
      setEvalResults(null);
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setApplying(false);
    }
  }

  // ... (unchanged rendering)
}