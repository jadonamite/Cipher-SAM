import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import TopNav from '@/components/app/TopNav';
import { normalizeRec } from '@/lib/normalize';
import { aggregateByCurrency, formatAggregate, formatMoney } from '@/lib/format';

// ... (rest of the code remains the same)

const calculateSavings = (recs: Rec[]) => {
  const savingsCandidates = recs.filter((r) => r.action === 'cancel' || r.action === 'pause');
  const savingsByCurrency = aggregateByCurrency(
    savingsCandidates,
    (r) => monthlyEquiv(r.amount, r.cadence),
    (r) => r.currency ?? 'USD',
  );
  const totalSavings = Object.values(savingsByCurrency).reduce((s, v) => s + v, 0);
  const totalSavingsStr = formatAggregate(savingsByCurrency);
  return { savingsCandidates, savingsByCurrency, totalSavings, totalSavingsStr };
};

export default function RecommendationsPage() {
  // ... (rest of the code remains the same)

  const { savingsCandidates, savingsByCurrency, totalSavings, totalSavingsStr } = calculateSavings(recs);

  // ... (rest of the code remains the same)
}