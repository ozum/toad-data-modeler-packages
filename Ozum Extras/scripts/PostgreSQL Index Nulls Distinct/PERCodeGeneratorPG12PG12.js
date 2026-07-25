function CreateIndex(index) {
	var sql = addOptions(index);
	return sql;
}

// This function adds "NULLS DISTINCT" to the index.
function addOptions(index) {
	var sql = Instance.CreateIndex(index);

	if (index.nullsNotDistinct) {
		// sql = sql.replace(/ AS/i, optionsSQL);
		sql = sql.replace(
			/\)([ \t\r\n]*);([ \t\r\n]*)$/,
			") NULLS NOT DISTINCT$1;$2",
		);
	}

	return sql;
}
