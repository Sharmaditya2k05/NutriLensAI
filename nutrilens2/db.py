"""
db.py — SQLite database for scan history & diet plans.
Auto-creates tables on import.
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime, timedelta

DB_PATH = Path(__file__).parent / "nutrilens.db"

def _conn():
    c = sqlite3.connect(str(DB_PATH))
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")
    return c

def init_db():
    c = _conn()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        brand TEXT DEFAULT '',
        barcode TEXT DEFAULT '',
        health_label TEXT DEFAULT 'moderate',
        health_score INTEGER DEFAULT 50,
        nutri_score TEXT DEFAULT 'N/A',
        nova_group INTEGER,
        energy_kcal REAL DEFAULT 0,
        fat REAL DEFAULT 0,
        saturated_fat REAL DEFAULT 0,
        carbohydrates REAL DEFAULT 0,
        sugars REAL DEFAULT 0,
        fiber REAL DEFAULT 0,
        proteins REAL DEFAULT 0,
        salt REAL DEFAULT 0,
        product_json TEXT DEFAULT '{}',
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS diet_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_json TEXT NOT NULL,
        goals TEXT DEFAULT '',
        restrictions TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    c.commit()
    c.close()

init_db()

def save_scan(product: dict, health_label: str, health_score: int):
    c = _conn()
    c.execute("""
        INSERT INTO scans (product_name, brand, barcode, health_label, health_score,
            nutri_score, nova_group, energy_kcal, fat, saturated_fat, carbohydrates,
            sugars, fiber, proteins, salt, product_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        product.get('name','Unknown'), product.get('brand',''),
        product.get('barcode',''), health_label, health_score,
        product.get('nutri_score','N/A'), product.get('nova_group'),
        product.get('energy_kcal',0), product.get('fat',0),
        product.get('saturated_fat',0), product.get('carbohydrates',0),
        product.get('sugars',0), product.get('fiber',0),
        product.get('proteins',0), product.get('salt',0),
        json.dumps(product)
    ))
    c.commit()
    scan_id = c.execute("SELECT last_insert_rowid()").fetchone()[0]
    c.close()
    return scan_id

def get_recent_scans(limit: int = 20) -> list:
    c = _conn()
    rows = c.execute("""
        SELECT id, product_name, brand, health_label, health_score,
               nutri_score, energy_kcal, sugars, proteins, fiber,
               scanned_at, product_json
        FROM scans ORDER BY scanned_at DESC LIMIT ?
    """, (limit,)).fetchall()
    c.close()
    result = []
    for r in rows:
        result.append({
            'id': r['id'], 'product_name': r['product_name'],
            'brand': r['brand'], 'health_label': r['health_label'],
            'health_score': r['health_score'], 'nutri_score': r['nutri_score'],
            'energy_kcal': r['energy_kcal'], 'sugars': r['sugars'],
            'proteins': r['proteins'], 'fiber': r['fiber'],
            'scanned_at': r['scanned_at'],
            'product': json.loads(r['product_json']) if r['product_json'] else {}
        })
    return result

def get_scan_stats() -> dict:
    c = _conn()
    total = c.execute("SELECT COUNT(*) FROM scans").fetchone()[0]
    healthy = c.execute("SELECT COUNT(*) FROM scans WHERE health_label='Healthy'").fetchone()[0]
    moderate = c.execute("SELECT COUNT(*) FROM scans WHERE health_label='Moderate'").fetchone()[0]
    unhealthy = c.execute("SELECT COUNT(*) FROM scans WHERE health_label='Unhealthy'").fetchone()[0]
    
    # Weekly data - last 7 days
    weekly = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        day_label = (datetime.now() - timedelta(days=i)).strftime('%a')
        row = c.execute("""
            SELECT COUNT(*) as cnt,
                   COALESCE(AVG(health_score), 0) as avg_score,
                   COALESCE(AVG(sugars), 0) as avg_sugar,
                   COALESCE(AVG(fiber), 0) as avg_fiber,
                   COALESCE(AVG(proteins), 0) as avg_protein
            FROM scans WHERE DATE(scanned_at) = ?
        """, (day,)).fetchone()
        weekly.append({
            'day': day_label, 'count': row['cnt'],
            'avg_score': round(row['avg_score'], 1),
            'sugar': round(row['avg_sugar'], 1),
            'fiber': round(row['avg_fiber'], 1),
            'protein': round(row['avg_protein'], 1)
        })
    
    # Avg nutrients
    avgs = c.execute("""
        SELECT COALESCE(AVG(sugars),0) as avg_sugar,
               COALESCE(AVG(fiber),0) as avg_fiber,
               COALESCE(AVG(proteins),0) as avg_protein,
               COALESCE(AVG(salt),0) as avg_salt
        FROM scans
    """).fetchone()
    
    # NOVA breakdown
    nova = {}
    for g in [1,2,3,4]:
        cnt = c.execute("SELECT COUNT(*) FROM scans WHERE nova_group=?", (g,)).fetchone()[0]
        nova[g] = cnt
    
    c.close()
    return {
        'total': total, 'healthy': healthy, 'moderate': moderate, 'unhealthy': unhealthy,
        'weekly': weekly,
        'avg_sugar': round(avgs['avg_sugar'], 1),
        'avg_fiber': round(avgs['avg_fiber'], 1),
        'avg_protein': round(avgs['avg_protein'], 1),
        'avg_salt': round(avgs['avg_salt'], 1),
        'nova': nova
    }

def save_diet_plan(plan: dict, goals: str, restrictions: str) -> int:
    c = _conn()
    c.execute("INSERT INTO diet_plans (plan_json, goals, restrictions) VALUES (?,?,?)",
              (json.dumps(plan), goals, restrictions))
    c.commit()
    plan_id = c.execute("SELECT last_insert_rowid()").fetchone()[0]
    c.close()
    return plan_id

def get_latest_diet_plan() -> dict:
    c = _conn()
    row = c.execute("SELECT * FROM diet_plans ORDER BY created_at DESC LIMIT 1").fetchone()
    c.close()
    if row:
        return {'id': row['id'], 'plan': json.loads(row['plan_json']),
                'goals': row['goals'], 'restrictions': row['restrictions'],
                'created_at': row['created_at']}
    return None
