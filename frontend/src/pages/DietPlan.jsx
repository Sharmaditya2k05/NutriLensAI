import React, { useState } from 'react'
import Loader from '../components/Loader'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_EMOJI = { breakfast: '🌅', lunch: '🍛', dinner: '🌙', snack: '🥜', 'morning snack': '🍎', 'evening snack': '🫖' }

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

export default function DietPlan() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [copied, setCopied] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

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
      .then(d => {
        if (d.error) {
          setError(d.error)
        } else {
          setPlan(d)
        }
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to generate diet plan. Please check your connection.')
        setLoading(false)
      })
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

  // ── Questionnaire Form ──────────────────────────────────────────────────────
  if (!plan && !loading) {
    return (
      <div>
        <div className="page-title">🥗 Personalized Diet Plan</div>
        <div className="page-sub">Fill in your details and our AI will generate a comprehensive 7-day meal plan tailored to your goals.</div>

        {error && <div className="danger-box" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Basic Info */}
          <div className="nl-card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1rem' }}>
              👤 Basic Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input className="input-field" type="number" name="age" value={form.age} onChange={handleChange} placeholder="25" required min="10" max="100" />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select className="input-field" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Weight (kg)</label>
                <input className="input-field" type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="70" required min="20" max="300" />
              </div>
              <div>
                <label style={labelStyle}>Height (cm)</label>
                <input className="input-field" type="number" name="height" value={form.height} onChange={handleChange} placeholder="170" required min="100" max="250" />
              </div>
            </div>
          </div>

          {/* Row 2: Goals & Activity */}
          <div className="nl-card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1rem' }}>
              🎯 Goals & Activity
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Activity Level</label>
                <select className="input-field" name="activity_level" value={form.activity_level} onChange={handleChange}>
                  <option value="sedentary">Sedentary (desk job)</option>
                  <option value="light">Light (1-2 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (athlete)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Goal</label>
                <select className="input-field" name="goal" value={form.goal} onChange={handleChange}>
                  <option value="lose weight">Lose Weight</option>
                  <option value="maintain weight">Maintain Weight</option>
                  <option value="gain weight">Gain Weight</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Meals Per Day</label>
                <select className="input-field" name="meals_per_day" value={form.meals_per_day} onChange={handleChange}>
                  <option value="2">2 meals</option>
                  <option value="3">3 meals</option>
                  <option value="4">4 meals</option>
                  <option value="5">5 meals</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Preferences */}
          <div className="nl-card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1rem' }}>
              🍽️ Dietary Preferences
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Cuisine Preference</label>
                <select className="input-field" name="cuisine_preference" value={form.cuisine_preference} onChange={handleChange}>
                  <option value="Indian">Indian</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="International">International</option>
                  <option value="Asian">Asian</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Dietary Restrictions</label>
                <input className="input-field" name="dietary_restrictions" value={form.dietary_restrictions} onChange={handleChange} placeholder="e.g. vegetarian, vegan, gluten-free" />
              </div>
              <div>
                <label style={labelStyle}>Allergies</label>
                <input className="input-field" name="allergies" value={form.allergies} onChange={handleChange} placeholder="e.g. peanuts, dairy, shellfish" />
              </div>
              <div>
                <label style={labelStyle}>Health Conditions</label>
                <input className="input-field" name="health_conditions" value={form.health_conditions} onChange={handleChange} placeholder="e.g. diabetes, hypertension" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-full" style={{ padding: '0.75rem', fontSize: '1rem' }}>
            🧠 Generate My Diet Plan
          </button>
        </form>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="page-title">🥗 Personalized Diet Plan</div>
        <Loader text="Generating your personalized 7-day diet plan with AI…" />
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
          This may take 15-30 seconds
        </div>
      </div>
    )
  }

  // ── Plan Display ────────────────────────────────────────────────────────────
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

  return (
    <div>
      <div className="page-title">🥗 Your Diet Plan</div>
      <div className="page-sub">Personalized 7-day meal plan based on your profile</div>

      {error && <div className="danger-box" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Calorie Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="nl-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>BMR</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6' }}>
            {bmr > 0 ? Math.round(bmr) : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>kcal/day</div>
        </div>
        <div className="nl-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>TDEE</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
            {tdee > 0 ? Math.round(tdee) : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>kcal/day</div>
        </div>
        <div className="nl-card nl-card-green" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>TARGET</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#1B6B3A' }}>
            {targetCal > 0 ? Math.round(targetCal) : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>kcal/day</div>
        </div>
      </div>

      {/* Macro Breakdown */}
      {macros && Object.keys(macros).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.75rem' }}>
            Macro Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              ['🥩 Protein', macros.protein || macros.protein_g, 'g', '#3B82F6'],
              ['🍞 Carbs', macros.carbs || macros.carbs_g, 'g', '#F59E0B'],
              ['🥑 Fat', macros.fat || macros.fat_g, 'g', '#EF4444'],
              ['🌾 Fiber', macros.fiber || macros.fiber_g, 'g', '#1B6B3A'],
            ].map(([label, val, unit, color]) => (
              <div key={label} className="nl-card" style={{ textAlign: 'center', borderTop: `3px solid ${color}` }}>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color }}>
                  {val != null ? `${Math.round(val)}${unit}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Tabs */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.75rem' }}>
          Weekly Meal Plan
        </div>
        <div className="tabs">
          {(days.length > 0 ? days : DAYS.map(d => ({ day: d }))).map((d, i) => (
            <button
              key={i}
              className={`tab-btn${activeDay === i ? ' active' : ''}`}
              onClick={() => setActiveDay(i)}
            >
              {DAY_SHORT[i] || d.day?.slice(0, 3) || `Day ${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Meals for Active Day */}
      {meals.length > 0 ? (
        <div style={{ marginBottom: '1.5rem' }}>
          {meals.map((meal, mi) => {
            const mealType = (meal.type || meal.meal_type || 'Meal').toLowerCase()
            const emoji = MEAL_EMOJI[mealType] || '🍽️'
            return (
              <div key={mi} className="nl-card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '1.2rem', marginRight: 8 }}>{emoji}</span>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#111827', textTransform: 'capitalize' }}>
                      {meal.type || meal.meal_type || 'Meal'}
                    </span>
                    {meal.name && (
                      <span style={{ fontSize: '0.85rem', color: '#6B7280', marginLeft: 8 }}>— {meal.name}</span>
                    )}
                  </div>
                  {meal.calories > 0 && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1B6B3A' }}>
                      🔥 {meal.calories} kcal
                    </span>
                  )}
                </div>

                {/* Items */}
                {meal.items && meal.items.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    {meal.items.map((item, ii) => (
                      <div key={ii} style={{ fontSize: '0.85rem', color: '#374151', padding: '3px 0', borderBottom: '1px solid #F3F4F6' }}>
                        {typeof item === 'string' ? `• ${item}` : `• ${item.name || item}${item.quantity ? ` — ${item.quantity}` : ''}`}
                      </div>
                    ))}
                  </div>
                )}

                {/* Macros */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  {meal.protein != null && (
                    <span style={macroTagStyle('#3B82F6')}>P: {meal.protein}g</span>
                  )}
                  {meal.carbs != null && (
                    <span style={macroTagStyle('#F59E0B')}>C: {meal.carbs}g</span>
                  )}
                  {meal.fat != null && (
                    <span style={macroTagStyle('#EF4444')}>F: {meal.fat}g</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Daily total */}
          {dailyTotal > 0 && (
            <div className="nl-card nl-card-green" style={{ textAlign: 'center' }}>
              <span style={{ fontWeight: 700, color: '#1B6B3A', fontSize: '0.95rem' }}>
                📊 Daily Total: {dailyTotal} kcal
              </span>
              {targetCal > 0 && (
                <span style={{ fontSize: '0.82rem', color: '#6B7280', marginLeft: 12 }}>
                  (Target: {Math.round(targetCal)} kcal)
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="nl-card" style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
          No meal data for this day
        </div>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <div className="nl-card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.75rem' }}>
            💡 Tips & Recommendations
          </div>
          {tips.map((tip, i) => (
            <div key={i} className="ok-box" style={{ marginBottom: '0.5rem' }}>
              {typeof tip === 'string' ? tip : tip.text || tip.message || JSON.stringify(tip)}
            </div>
          ))}
        </div>
      )}

      {/* Hydration */}
      {hydration && (
        <div className="nl-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>💧</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 2 }}>Hydration Recommendation</div>
              <div style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.6 }}>
                {typeof hydration === 'string' ? hydration : hydration.recommendation || `Drink ${hydration.liters || hydration.glasses || 8} glasses of water per day`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplements */}
      {supplements.length > 0 && (
        <div className="nl-card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.75rem' }}>
            💊 Supplements
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {supplements.map((s, i) => (
              <div key={i} className="info-box">
                {typeof s === 'string' ? s : `${s.name || s.supplement}${s.dosage ? ` — ${s.dosage}` : ''}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
        <button className="btn btn-full" onClick={handleNewPlan}>
          🔄 Generate New Plan
        </button>
        <button className={`btn-primary btn-full`} onClick={handleExport}>
          {copied ? '✅ Copied to Clipboard!' : '📋 Export Plan'}
        </button>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '0.35rem',
}

const macroTagStyle = (color) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  color,
  background: color + '15',
  padding: '2px 8px',
  borderRadius: 6,
})
