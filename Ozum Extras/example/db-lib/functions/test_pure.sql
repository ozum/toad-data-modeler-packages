/*
 * util.testing_pure_sql()
 * ------------------------------------------------
 * Simple test function to validate GUID injection logic for LANGUAGE sql bodies.
 */
CREATE OR REPLACE FUNCTION util.testing_pure_sql (input_value numeric, multiplier numeric DEFAULT 2) RETURNS TABLE (doubled numeric, squared numeric, comment text) LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
-- @GUID {A105D024-F750-4086-8B09-89EA8347F512} - DON'T CHANGE THIS LINE! TOAD Data Modeler ID used in sync.
  SELECT
    input_value * multiplier AS doubled,
    input_value * input_value AS squared,
    format('Input=%s Multiplier=%s', input_value, multiplier) AS comment;
$$;



