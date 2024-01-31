export function parseCsv(csvString: string): string[][] {
	// Split the CSV string by line breaks to get an array of rows
	const rows = csvString.split("\n");

	// Map each row to an array of values (split by comma)
	return rows.map((row) => {
		// Handling potential quotes in CSV
		return (row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(
			(str: string) => str.slice(1, -1)
		);
	});
}
