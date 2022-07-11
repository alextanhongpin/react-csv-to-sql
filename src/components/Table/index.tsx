import React from "react";
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
  if (errors?.length) {
    const list = errors.map((err: ParseError) => {
      return `row=${err.row + 1} error=${err.message} data=${JSON.stringify(
        data[err.row]
      )}`;
    });

    return (
      <ul>
        {list.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <table className={classes.table}>
      <thead className={classes.thead}>
        <tr>
          {meta?.fields?.map((field: string) => (
            <th key={field}>{field}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row) => {
          const columns = meta?.fields?.map(
            (field: string) => (row as any)[field]
          );

          return (
            <tr>
              {columns?.map((col) => (
                <td>{col}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
