/*
 * util.testing_pure_sql()
 * ------------------------------------------------
 * Simple test function to validate GUID injection logic for LANGUAGE sql bodies.
 */
CREATE OR REPLACE FUNCTION util.testing_pure_sql (input_value numeric, multiplier numeric DEFAULT 2) RETURNS TABLE (doubled numeric, squared numeric, comment text) LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
-- @GUID {645BC24C-54FF-40C7-8434-107FC7A00F1B} - DON'T CHANGE THIS LINE! TOAD Data Modeler ID used in sync.
  SELECT
    input_value * multiplier AS doubled,
    input_value * input_value AS squared,
    format('Input=%s Multiplier=%s', input_value, multiplier) AS comment;
$$;

