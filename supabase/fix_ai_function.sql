CREATE OR REPLACE FUNCTION execute_ai_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result       JSONB;
  clean_query  TEXT;
  upper_query  TEXT;
BEGIN
  -- Strip leading/trailing whitespace including newlines and tabs
  clean_query := btrim(query_text, E' \t\n\r\f\v');
  upper_query := UPPER(clean_query);

  -- SAFETY: Only allow SELECT or WITH (CTE) statements
  IF upper_query NOT LIKE 'SELECT%' AND upper_query NOT LIKE 'WITH%' THEN
    RAISE EXCEPTION 'Security violation: Only SELECT queries are permitted. Query: %', LEFT(clean_query, 100);
  END IF;

  -- SAFETY: Block destructive keywords
  IF upper_query ~ '\y(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|EXEC|EXECUTE)\y' THEN
    RAISE EXCEPTION 'Security violation: Destructive keyword detected in query';
  END IF;

  -- Execute and return as JSON array
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    clean_query
  ) INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'query', LEFT(clean_query, 200));
END;
$$;
