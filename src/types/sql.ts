export function valuesStmt(columns: string[], values: string[]): string {
  const stmt = `
WITH raw(${columns.join(", ")}) AS (VALUES 
${values.map((value) => `  ${value}`).join(",\n")}
)
SELECT *
FROM raw`;

  return stmt.trim();
}
