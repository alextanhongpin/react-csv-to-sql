import React, { useMemo } from "react";
import type { ParseResult, ParseError, ParseMeta } from "papaparse";
import classes from "./index.module.css";

const defaultParseMeta: ParseMeta = {
  delimiter: "",
  linebreak: "",
  aborted: false,
  fields: [],
  truncated: false,
  cursor: -1,
};

type Props = {
  children?: React.Component;
  data: ParseResult<any>[];
  meta: ParseMeta;
  errors: ParseError[];
};

export default function CSVTable({
  data = [],
  meta = defaultParseMeta,
  errors = [],
}: Props): JSX.Element | null {
  switch (errors.length) {
    case 0:
      return <Table data={data} />;
    default:
      if (errors[0].row === undefined) {
        return <div>{errors[0]?.message}</div>;
      }

      const dataWithError = errors.map((err: ParseError) => {
        const row = data[err.row];
        return {
          row: err.row + 1,
          error: err.message,
          ...row,
        };
      });

      return <Table data={dataWithError} />;
  }
}

function Table({ data = [] }: { data: any[] }) {
  const columns = useMemo(() => {
    if (!data) return [];
    return Object.keys(data[0] ?? {});
  }, [data]);

  if (!data?.length) return null;

  return (
    <table className={classes.table}>
      <thead className={classes.thead}>
        <tr>
          {columns.map((column: string) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => {
          const values = Object.values(row);

          return (
            <tr key={index}>
              {values?.map((val: any) => (
                <td key={val}>{val}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
