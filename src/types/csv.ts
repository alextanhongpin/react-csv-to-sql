export type Parser<T = string | number | boolean> = {
  (value: string): T;
};

export type ColumnType = "text" | "int" | "bool";

const parsers: Record<ColumnType, Parser> = {
  int: parseInt,
  text: parseText,
  bool: parseBool,
};

export function getParser(type: ColumnType, strict = false): Parser {
  const parser = parsers[type];
  if (strict && !parser) {
    throw new Error(`ParserError: parser not implemented for "${type}"`);
  }

  return parser ?? parser["text"];
}

function parseText(value: string): string {
  // Handles single quote for postgres.
  return value.trim().replaceAll("'", "''");
}

function parseInt(value: string): number {
  const number = Number(value.replaceAll(/\D/g, ""));
  if (isNaN(number)) {
    throw new Error(`IntError: "${value}" is not a number`);
  }

  return number;
}

function parseBool(value: string): boolean {
  const bool = value.trim().toLowerCase();
  if (!["true", "false"].includes(bool)) {
    throw new Error(`BoolError: "${bool}" is not a boolean`);
  }

  return bool === "true";
}
