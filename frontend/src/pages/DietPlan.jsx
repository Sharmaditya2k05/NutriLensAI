import React, { useState } from 'react'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Badge from '../components/Badge'
import { normalizeDietPlan } from '../lib/normalize'
import { Button, Segmented, PageHead, Note, CountUp, SplitBar, Meter } from '../components/ui'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT_FORM = {
  age: '',
  gender: 'male',
  weight: '',
  height: '',
  activity_level: 'moderate',
  goal: 'maintain weight',
  dietary_restrictions: '',
  allergies: '',
  meals_per_day: '3',
  cuisine_preference: 'Indian',
  health_conditions: '',
}

const ACTIVITY = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Desk job' },
  { value: 'light', label: 'Light', hint: '1–2 days a week' },
  { value: 'moderate', label: 'Moderate', hint: '3–5 days' },
  { value: 'active', label: 'Active', hint: '6–7 days' },
  { value: 'very_active', label: 'Athlete', hint: 'Twice a day' },
]
const RESTRICTION_PRESETS = ['Vegetarian', 'Vegan', 'Jain', 'Eggetarian', 'Gluten-free']

function NumberField({ label, name, value, onChange, unit, placeholder, min, max }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        <input className="input has-unit" type="number" inputMode="numeric" name={name} value={value} onChange={onChange} placeholder={placeholder} required min={min} max={max} />
        {unit && <span className="input-unit">{unit}</span>}
      </span>
    </label>
  )
}

function TextField({ label, name, value, onChange, placeholder }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className="input" name={name} value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  )
}

function Section({ step, title, children }) {
  return (
    <section className="panel">
      <div className="row" style={{ marginBottom: 18 }}>
        <span className="grade sm" style={{ background: 'var(--ink)', fontSize: '0.9rem' }}>{step}</span>
        <h2 className="h3">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function DietPlan() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [copied, setCopied] = useState(false)

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }))
  const handleChange = e => set(e.target.name, e.target.value)

  function toggleRestriction(r) {
    const list = form.dietary_restrictions.split(',').map(s => s.trim()).filter(Boolean)
    const has = list.some(x => x.toLowerCase() === r.toLowerCase())
    const next = has ? list.filter(x => x.toLowerCase() !== r.toLowerCase()) : [...list, r.toLowerCase()]
    set('dietary_restrictions', next.join(', '))
  }
  const hasRestriction = r => form.dietary_restrictions.toLowerCase().split(',').map(s => s.trim()).includes(r.toLowerCase())

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const payload = {
      ...form,
      age: Number(form.age),
      weight: Number(form.weight),
      height: Number(form.height),
      meals_per_day: Number(form.meals_per_day),
    }
    fetch('/api/diet-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setPlan(normalizeDietPlan(d)) })
      .catch(() => setError("The plan couldn't be generated. Check that the NutriLens server is running on port 8000."))
      .finally(() => setLoading(false))
  }

  function handleExport() {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {})
  }

  function handleNewPlan() {
    setPlan(null)
    setError(null)
    setActiveDay(0)
  }

  // ── Questionnaire ───────────────────────────────────────────────────────────
  if (!plan && !loading) {
    return (
      <>
        <PageHead title="Build a diet plan">
          Answer a few questions and get a 7-day meal plan sized to your body, routine and goal.
        </PageHead>

        {error && <div className="mb-md"><Note tone="bad">{error}</Note></div>}

        <form onSubmit={handleSubmit} className="stack">
          <Section step="1" title="About you">
            <div className="grid g-4" style={{ alignItems: 'end' }}>
              <NumberField label="Age" name="age" value={form.age} onChange={handleChange} unit="yrs" placeholder="25" min="10" max="100" />
              <div className="field">
                <span className="field-label">Sex</span>
                <Segmented block label="Sex" value={form.gender} onChange={v => set('gender', v)}
                  options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
              </div>
              <NumberField label="Weight" name="weight" value={form.weight} onChange={handleChange} unit="kg" placeholder="70" min="20" max="300" />
              <NumberField label="Height" name="height" value={form.height} onChange={handleChange} unit="cm" placeholder="170" min="100" max="250" />
            </div>
          </Section>

          <Section step="2" title="Goal and routine">
            <div className="stack">
              <div className="field">
                <span className="field-label">How active are you?</span>
                <Segmented block tall label="Activity level" value={form.activity_level} onChange={v => set('activity_level', v)} options={ACTIVITY} />
              </div>
              <div className="grid g-2">
                <div className="field">
                  <span className="field-label">Goal</span>
                  <Segmented block label="Goal" value={form.goal} onChange={v => set('goal', v)} options={[
                    { value: 'lose weight', label: 'Lose' },
                    { value: 'maintain weight', label: 'Maintain' },
                    { value: 'gain weight', label: 'Gain' },
                  ]} />
                </div>
                <div className="field">
                  <span className="field-label">Meals a day</span>
                  <Segmented block label="Meals per day" value={form.meals_per_day} onChange={v => set('meals_per_day', v)}
                    options={['2', '3', '4', '5'].map(n => ({ value: n, label: n }))} />
                </div>
              </div>
            </div>
          </Section>

          <Section step="3" title="Food preferences">
            <div className="stack">
              <div className="field">
                <span className="field-label">Cuisine</span>
                <div className="row-wrap">
                  {['Indian', 'Mediterranean', 'International', 'Asian'].map(c => (
                    <button key={c} type="button" aria-pressed={form.cuisine_preference === c}
                      className={`chip chip-plain ${form.cuisine_preference === c ? 'selected' : ''}`}
                      onClick={() => set('cuisine_preference', c)}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span className="field-label">Diet</span>
                <div className="row-wrap" style={{ marginBottom: 8 }}>
                  {RESTRICTION_PRESETS.map(r => (
                    <button key={r} type="button" aria-pressed={hasRestriction(r)}
                      className={`chip chip-plain ${hasRestriction(r) ? 'selected' : ''}`}
                      onClick={() => toggleRestriction(r)}>
                      {hasRestriction(r) && <Icon name="check" size={14} stroke={2.6} />}{r}
                    </button>
                  ))}
                </div>
                <input className="input" name="dietary_restrictions" value={form.dietary_restrictions} onChange={handleChange} placeholder="Or type your own, e.g. no onion or garlic" aria-label="Dietary restrictions" />
              </div>
              <div className="grid g-2">
                <TextField label="Allergies" name="allergies" value={form.allergies} onChange={handleChange} placeholder="e.g. peanuts, dairy" />
                <TextField label="Health conditions" name="health_conditions" value={form.health_conditions} onChange={handleChange} placeholder="e.g. type 2 diabetes, high BP" />
              </div>
            </div>
          </Section>

          <Button type="submit" variant="primary" size="lg" block iconRight="arrowRight">Create my 7-day plan</Button>
        </form>
      </>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <PageHead title="Build a diet plan" />
        <section className="panel">
          <Loader
            text="This usually takes 15 to 30 seconds."
            steps={['Working out your energy needs', 'Balancing protein, carbs and fat', 'Writing seven days of meals', 'Adding tips for your goal']}
          />
        </section>
      </>
    )
  }

  // ── Plan ────────────────────────────────────────────────────────────────────
  const bmr = plan?.bmr || 0
  const tdee = plan?.tdee || 0
  const targetCal = plan?.target_calories || plan?.daily_calories || 0
  const macros = plan?.macros || plan?.macro_split || {}
  const days = plan?.days || plan?.meal_plan || []
  const tips = plan?.tips || plan?.general_tips || []
  const hydration = plan?.hydration || plan?.hydration_recommendation || ''
  const supplements = plan?.supplements || plan?.supplement_suggestions || []

  const currentDay = days[activeDay] || {}
  const meals = currentDay.meals || []
  const dailyTotal = meals.reduce((s, m) => s + (m.calories || 0), 0)

  const protein = macros.protein || macros.protein_g
  const carbs = macros.carbs || macros.carbs_g
  const fat = macros.fat || macros.fat_g
  const fiber = macros.fiber || macros.fiber_g
  const dayTabs = (days.length > 0 ? days : DAYS.map(d => ({ day: d }))).map((d, i) => ({
    value: i, label: DAY_SHORT[i] || d.day?.slice(0, 3) || `Day ${i + 1}`,
  }))

  return (
    <>
      <PageHead
        title="Your 7-day plan"
        actions={<>
          <Button variant="ghost" icon="refresh" iconMotion="spin" onClick={handleNewPlan}>Start over</Button>
          <Button variant="primary" icon="copy" done={copied} onClick={handleExport}>{copied ? 'Copied' : 'Copy plan'}</Button>
        </>}
      >
        Sized for a {form.goal.replace(' weight', '')} goal with {form.meals_per_day} meals a day.
      </PageHead>

      {error && <div className="mb-md"><Note tone="bad">{error}</Note></div>}

      <section className="panel">
        <div className="stats">
          <div>
            <div className="stat-k">Resting burn (BMR)</div>
            <div className="stat-v num">{bmr > 0 ? <CountUp value={Math.round(bmr)} /> : '—'}<small>kcal</small></div>
          </div>
          <div>
            <div className="stat-k">With activity (TDEE)</div>
            <div className="stat-v num">{tdee > 0 ? <CountUp value={Math.round(tdee)} /> : '—'}<small>kcal</small></div>
          </div>
          <div>
            <div className="stat-k"><Icon name="target" size={16} style={{ color: 'var(--ns-a)' }} />Daily target</div>
            <div className="stat-v num" style={{ color: 'var(--ns-a)' }}>{targetCal > 0 ? <CountUp value={Math.round(targetCal)} /> : '—'}<small>kcal</small></div>
          </div>
          <div>
            <div className="stat-k">Fibre</div>
            <div className="stat-v num">{fiber != null ? Math.round(fiber) : '—'}<small>g</small></div>
          </div>
        </div>
        {(protein || carbs || fat) && (
          <div className="mt-lg">
            <div className="small muted" style={{ marginBottom: 8 }}>Daily macros</div>
            <SplitBar parts={[
              { label: 'Protein', value: (protein || 0) * 4, display: `${Math.round(protein || 0)} g`, color: 'var(--ns-a)' },
              { label: 'Carbs', value: (carbs || 0) * 4, display: `${Math.round(carbs || 0)} g`, color: 'var(--ns-c)' },
              { label: 'Fat', value: (fat || 0) * 9, display: `${Math.round(fat || 0)} g`, color: 'var(--ns-d)' },
            ]} />
          </div>
        )}
      </section>

      <div className="section-title" style={{ flexWrap: 'wrap' }}>
        <h2 className="h3">Meals</h2>
        <Segmented label="Day" value={activeDay} onChange={setActiveDay} options={dayTabs} />
      </div>

      <div className="grid g-side" style={{ alignItems: 'start' }}>
        <div key={activeDay} className="tab-panel">
          {meals.length > 0 ? (
            <div className="timeline enter-list">
              {meals.map((meal, mi) => (
                <article key={mi} className="panel meal">
                  <div className="between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div className="small faint" style={{ textTransform: 'capitalize' }}>{meal.type || meal.meal_type || 'Meal'}</div>
                      <h3 className="h3" style={{ marginTop: 2 }}>{meal.name || 'Meal'}</h3>
                    </div>
                    {meal.calories > 0 && <span className="num" style={{ fontSize: '1.15rem' }}>{meal.calories}<span className="tiny faint" style={{ fontWeight: 500 }}> kcal</span></span>}
                  </div>
                  {meal.items?.length > 0 && (
                    <ul className="meal-items">
                      {meal.items.map((item, ii) => (
                        <li key={ii}>
                          <span>{typeof item === 'string' ? item : item.name || String(item)}</span>
                          {typeof item !== 'string' && item.quantity && <span className="faint">{item.quantity}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="macro-tags">
                    {meal.protein != null && <Badge label={`Protein ${meal.protein} g`} color="green" />}
                    {meal.carbs != null && <Badge label={`Carbs ${meal.carbs} g`} color="amber" />}
                    {meal.fat != null && <Badge label={`Fat ${meal.fat} g`} color="gray" />}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="panel faint">No meals were returned for {DAYS[activeDay]}.</p>
          )}
        </div>

        <aside className="stack">
          {dailyTotal > 0 && (
            <section className="panel">
              <div className="small muted">{DAYS[activeDay]} total</div>
              <div className="num" style={{ fontSize: '2.2rem', margin: '4px 0 12px' }}>
                <CountUp key={activeDay} value={dailyTotal} /><small className="faint" style={{ fontSize: '0.9rem' }}> kcal</small>
              </div>
              {targetCal > 0 && (
                <>
                  <Meter key={activeDay} lg value={(dailyTotal / targetCal) * 100} color={Math.abs(dailyTotal - targetCal) / targetCal < 0.1 ? 'var(--ns-a)' : 'var(--ns-d)'} label="Share of daily target" />
                  <div className="tiny faint" style={{ marginTop: 8 }}>{Math.round((dailyTotal / targetCal) * 100)}% of your {Math.round(targetCal)} kcal target</div>
                </>
              )}
            </section>
          )}

          {hydration && (
            <section className="panel panel-sage row" style={{ alignItems: 'flex-start', gap: 12 }}>
              <Icon name="droplet" size={22} style={{ color: 'var(--info)', flexShrink: 0 }} />
              <div>
                <h3 className="h3" style={{ marginBottom: 4 }}>Water</h3>
                <p className="small muted">
                  {typeof hydration === 'string' ? hydration : hydration.recommendation || `Drink ${hydration.liters || hydration.glasses || 8} glasses of water a day`}
                </p>
              </div>
            </section>
          )}

          {supplements.length > 0 && (
            <section className="panel">
              <div className="row" style={{ marginBottom: 12 }}><Icon name="pill" size={19} /><h3 className="h3">Supplements to consider</h3></div>
              <ul style={{ listStyle: 'none' }} className="stack-sm small">
                {supplements.map((s, i) => (
                  <li key={i} className="muted">{typeof s === 'string' ? s : `${s.name || s.supplement}${s.dosage ? `, ${s.dosage}` : ''}`}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {tips.length > 0 && (
        <section className="mt-lg">
          <h2 className="h3 mb-md">Tips for your goal</h2>
          <div className="grid g-2">
            {tips.map((tip, i) => (
              <Note key={i} tone="good" icon="leaf">{typeof tip === 'string' ? tip : tip.text || tip.message || JSON.stringify(tip)}</Note>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
