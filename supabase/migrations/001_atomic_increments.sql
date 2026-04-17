-- Atomic increment functions for rate limiting and API key request counting
-- These RPCs eliminate read-then-write race conditions by performing
-- the read + write in a single atomic SQL statement.

-- ─── Increment api_keys.request_count atomically ─────────────────────
-- Called after a successful API key verification to bump the counter
-- and update last_used_at without a stale read.
CREATE OR REPLACE FUNCTION increment_api_key_request_count(key_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE api_keys
  SET request_count = COALESCE(request_count, 0) + 1,
      last_used_at   = NOW()
  WHERE id = key_id;
$$;

-- ─── Atomic rate limit check-and-increment ───────────────────────────
-- Inserts a new window or atomically increments an existing one.
-- Returns: { allowed: bool, remaining: int, limit: int, reset_at: timestamptz }
--
-- Usage: SELECT * FROM check_rate_limit('identifier', 100, 60);
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier   TEXT,
  p_limit         INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, limit INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_reset_at     TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_window_start := DATE_TRUNC('second', NOW() - (INTERVAL '1 second' * (EXTRACT(EPOCH FROM NOW())::BIGINT % p_window_seconds)));
  v_reset_at     := v_window_start + (INTERVAL '1 second' * p_window_seconds);

  -- Try to increment an existing, non-expired window
  UPDATE api_rate_limits
  SET request_count = request_count + 1
  WHERE identifier   = p_identifier
    AND window_start >= v_window_start;

  GET DIAGNOSTICS v_current_count = ROW_COUNT;

  IF v_current_count > 0 THEN
    -- Updated an existing row — fetch the new count
    SELECT request_count INTO v_current_count
    FROM api_rate_limits
    WHERE identifier = p_identifier;

    IF v_current_count > p_limit THEN
      -- Over the limit: decrement the counter we just incremented
      UPDATE api_rate_limits
      SET request_count = request_count - 1
      WHERE identifier = p_identifier;

      RETURN QUERY SELECT FALSE, 0, p_limit, v_reset_at;
    ELSE
      RETURN QUERY SELECT TRUE, p_limit - v_current_count, p_limit, v_reset_at;
    END IF;
  ELSE
    -- No active window — insert a fresh one
    INSERT INTO api_rate_limits (identifier, window_start, request_count)
    VALUES (p_identifier, NOW(), 1)
    ON CONFLICT (identifier)
    DO UPDATE SET window_start   = NOW(),
                  request_count  = 1;

    RETURN QUERY SELECT TRUE, p_limit - 1, p_limit, v_reset_at;
  END IF;
END;
$$;