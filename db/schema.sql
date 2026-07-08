-- Quantum Lab — Supabase schema
-- Paste this into the Supabase SQL Editor and click Run.
-- Tables are created in dependency order so foreign keys resolve correctly.

-- ──────────────────────────────────────────────
-- 1. users
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id             SERIAL PRIMARY KEY,
    first_name          VARCHAR     NOT NULL,
    last_name           VARCHAR     NOT NULL,
    username            VARCHAR     NOT NULL UNIQUE,
    email               VARCHAR     NOT NULL UNIQUE,
    password_hash       TEXT        NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    username_changed_at TIMESTAMPTZ
);

-- Migration: run this if the table already exists
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;

-- ──────────────────────────────────────────────
-- 2. missions
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS missions (
    mission_id     SERIAL PRIMARY KEY,
    title          VARCHAR NOT NULL,
    description    TEXT    NOT NULL,
    difficulty     VARCHAR NOT NULL,
    estimated_time INTEGER NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 3. mission_steps
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mission_steps (
    step_id    SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL REFERENCES missions (mission_id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    title      VARCHAR NOT NULL,
    content    TEXT    NOT NULL,
    step_type  VARCHAR NOT NULL
);

-- ──────────────────────────────────────────────
-- 4. user_choices
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_choices (
    choice_id       SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users         (user_id)    ON DELETE CASCADE,
    mission_id      INTEGER NOT NULL REFERENCES missions      (mission_id) ON DELETE CASCADE,
    step_id         INTEGER NOT NULL REFERENCES mission_steps (step_id)    ON DELETE CASCADE,
    selected_option TEXT    NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 5. sandbox_runs
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sandbox_runs (
    run_id            SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    simulation_type   VARCHAR NOT NULL,
    search_space_size INTEGER NOT NULL,
    algorithm_type    VARCHAR NOT NULL,
    classical_steps   INTEGER NOT NULL,
    quantum_steps     INTEGER NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- 6. lessons
-- ──────────────────────────────────────────────
-- id is a human-readable slug (e.g. 'what-is-a-qubit'), not a SERIAL, so it can
-- be used directly in the /resources/:id frontend route with no lookup table.
CREATE TABLE IF NOT EXISTS lessons (
    id          VARCHAR PRIMARY KEY,
    title       VARCHAR     NOT NULL,
    category    VARCHAR     NOT NULL,
    summary     TEXT        NOT NULL,
    video_id    VARCHAR     NOT NULL,
    duration    VARCHAR,
    links       JSONB       NOT NULL DEFAULT '[]'::jsonb,
    interactive VARCHAR,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
