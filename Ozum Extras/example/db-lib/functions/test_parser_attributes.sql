/*
 * util.test_parser_attributes(accountId" uuid, p_amount numeric)
 * ------------------------------------------------
 * Some test function to demonstrate every possible parser attribute.
 *
 * Notes:
 *   - Some notes about this function.
 */
CREATE OR REPLACE FUNCTION util.test_parser_attributes (
	"accountId" uuid,
	p_amount numeric,
	INOUT p_label text DEFAULT 'default label'
) RETURNS TABLE (result_code integer, result_text text) LANGUAGE plpgsql IMMUTABLE STRICT SECURITY DEFINER LEAKPROOF COST 42 ROWS 7 PARALLEL SAFE AS $$
DECLARE
	v_now timestamptz := clock_timestamp();
BEGIN
	-- @GUID {69F05895-E35D-491B-8BA0-1561DD60FCD0} - DON'T CHANGE THIS LINE! TOAD Data Modeler ID used in sync.
	result_code := 1;
	result_text := format('Account: %s Amount: %s Label: %s Time: %s', "accountId", p_amount, p_label, v_now);
	RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION util.test_parser_attributes (uuid, numeric, text) IS $$
Demonstrates every parser attribute:
- custom RETURNS TABLE clause
- volatility and strictness options
- COST/ROWS/PARALLEL
- SECURITY DEFINER & LEAKPROOF
- embedded Toad:ID hint inside the body
$$;



