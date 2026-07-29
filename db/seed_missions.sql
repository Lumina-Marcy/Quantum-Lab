-- Quantum Lab — seed the missions table
-- Paste this into the Supabase SQL Editor and click Run (after schema.sql / its migration
-- comments have been applied — this needs the status/terminal_lines columns and the
-- estimated_time VARCHAR type to already exist).
--
-- Safe to re-run: ON CONFLICT upserts by mission_id, so editing a row here and re-running
-- updates it in place instead of duplicating it. To add a 6th mission, just append another
-- row with the next mission_id — no code change needed, which is the whole point of this move.

INSERT INTO missions (mission_id, title, description, difficulty, estimated_time, status, terminal_lines) VALUES
(1, 'Lost Medical Breakthrough',
 'Somewhere in millions of molecular combinations is a cure. Find it before time runs out.',
 'Beginner', '~1 min', 'available',
 '["Searching Molecular Structures..."]'::jsonb),

(2, 'Maze Search',
 'Trapped with no map. Every junction splits your qubit into every path forward at once — cover as much ground as you can before one branch finds the exit.',
 'Beginner', '5–7 min', 'available',
 '["Search Space: 1,000,000 Paths", "Quantum Advantage: Expected"]'::jsonb),

(3, 'Password Vault',
 'A quantum computer is trying to break into your vault. Can today''s encryption survive tomorrow''s technology?',
 'Intermediate', '5 min', 'available',
 '["Initializing...", "Encryption Detected...", "Threat Level: HIGH"]'::jsonb),

(4, 'The Supply Chain Crisis',
 'A global supply chain is collapsing under its own complexity. Reroute it before the crisis spreads.',
 'Intermediate', '~2 min', 'available',
 '["Optimization Ready"]'::jsonb),

(5, 'Government Files',
 'Classified files are under attack from a quantum-powered intrusion. Defend what has to stay secret.',
 'Advanced', '5–6 min', 'available',
 '["Encryption Audit Pending..."]'::jsonb)

ON CONFLICT (mission_id) DO UPDATE SET
    title          = EXCLUDED.title,
    description    = EXCLUDED.description,
    difficulty     = EXCLUDED.difficulty,
    estimated_time = EXCLUDED.estimated_time,
    status         = EXCLUDED.status,
    terminal_lines = EXCLUDED.terminal_lines;

-- Keeps the next auto-generated id past whatever we just inserted explicitly, so a mission added
-- later through the Supabase UI (leaving mission_id blank) gets 6, not a collision with one of these.
SELECT setval(pg_get_serial_sequence('missions', 'mission_id'), (SELECT MAX(mission_id) FROM missions));
