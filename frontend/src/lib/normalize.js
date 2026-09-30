// The FastAPI server and the old UI disagreed on a few response shapes.
// These adapters accept either shape so the pages always get what they expect.

const NOVA_LABELS = { 1: 'Unprocessed', 2: 'Culinary ingredients', 3: 'Processed', 4: 'Ultra-processed' }

// /api/scans/stats → server sends { total, healthy, moderate, unhealthy, weekly[avg_score], nova: {1: n} }
export function normalizeStats(d) {
  if (!d) return null
  const total = d.total_scans ?? d.total ?? 0
  const pct = n => (total ? Math.round(((n || 0) / total) * 100) : 0)

  let nova = d.nova_breakdown || d.nova
  if (nova && !Array.isArray(nova)) {
    nova = [1, 2, 3, 4].map(n => ({ n, label: NOVA_LABELS[n], pct: pct(nova[n] ?? nova[String(n)]) }))
  }

  return {
    ...d,
    total_scans: total,
    healthy_percent: d.healthy_percent ?? pct(d.healthy),
    moderate_percent: d.moderate_percent ?? pct(d.moderate),
    unhealthy_percent: d.unhealthy_percent ?? pct(d.unhealthy),
    weekly: (d.weekly || []).map(w => ({ ...w, score: w.score ?? w.avg_score ?? 0 })),
    nova_breakdown: nova,
  }
}

// /api/diet-plan → server sends { plan: {days, macros, tips…}, bmr, tdee, target_calories }
export function normalizeDietPlan(d) {
  if (!d || !d.plan || Array.isArray(d.plan)) return d
  return {
    ...d.plan,
    bmr: d.bmr ?? d.plan.bmr,
    tdee: d.tdee ?? d.plan.tdee,
    target_calories: d.target_calories ?? d.plan.target_calories ?? d.plan.daily_calories,
  }
}
