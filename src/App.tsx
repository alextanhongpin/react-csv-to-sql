import React, { useState, useEffect, useMemo, useRef } from "react";
import { parse } from "papaparse";
import type { ParseResult, ParseError, ParseMeta } from "papaparse";

import { getParser } from "types/csv";
import type { Parser, ColumnType } from "types/csv";
import { copyTextToClipboard } from "ports/clipboard";
import { useDebounce } from "ports/debounce";
import { valuesStmt } from "types/sql";
import Table from "components/Table";
import classes from "./App.module.css";

const defaultParseMeta: ParseMeta = {
  delimiter: "",
  linebreak: "",
  aborted: false,
  fields: [],
  truncated: false,
  cursor: -1,
};

function App() {
  const [csv, setCSV] = useState("");
  const [parsedResult, setParsedResult] = useState<ParseResult<any>>();
  const formRef = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);
  const [sql, setSQL] = useState("");
  const debouncedCSV = useDebounce(csv, 250);

  const { data, errors, meta } = useMemo(() => {
    const { data, errors, meta } = parsedResult ?? {};
    return {
      data: data ?? ([] as Array<ParseResult<any>>),
      errors: errors ?? ([] as Array<ParseError>),
      meta: meta ?? defaultParseMeta,
    };
  }, [parsedResult]);

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCSV(evt.currentTarget.value);
  };

  const handleGenerate = () => {
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);

    const columns: string[] = (meta?.fields ?? [])
      .map((field: string) => {
        const column = formData.get(field);
        if (!column) {
          throw new Error(`FormError: "${field}" not found`);
        }

        const included = formData.get(`${field}.include`);
        if (!included) {
          return "";
        }

        return column as string;
      })
      .filter(Boolean);

    const values: string[] = data.map((row) => {
      const values = Object.entries(row).map(([key, value]): string => {
        const type = formData.get(`${key}.type`) as ColumnType;
        if (!type) {
          throw new Error(`FormError: key "${key}.type" not found`);
        }

        const included = formData.get(`${key}.include`);
        if (!included) return "";

        const strict = true;
        const parser: Parser = getParser(type, strict);
        const parsed = parser?.(value as string);
        switch (type) {
          case "text":
            return `'${parsed}'`;
          case "bool":
          case "int":
            return `${parsed}`;
        }
      });

      return `(${values.filter((value) => value !== "").join(", ")})`;
    });

    const sql = valuesStmt(columns, values);
    setSQL(sql);
  };

  const handleClick = async () => {
    setCopied(true);
    await copyTextToClipboard(sql);
  };

  useEffect(() => {
    const result = parse(debouncedCSV, {
      header: true,
    });

    setParsedResult(result);
  }, [debouncedCSV]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 750);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copied]);

  return (
    <div className={classes.container}>
      <h1>CSV to SQL™</h1>
      <p>Converts CSV data to SQL Values</p>

      <div>
        <h4>Input</h4>
        <textarea
          value={csv}
          onChange={handleChange}
          rows={10}
          cols={100}
          placeholder="Paste CSV here"
        />
      </div>
      <br />

      {csv ? (
        <>
          {data.length ? (
            <p>
              <b>{data.length} </b>rows <br />
            </p>
          ) : null}

          <Table data={data} errors={errors} meta={meta} />
          <br />
          <hr />

          <div className={classes.section}>
            <div>
              <div className={classes.header}>
                <h2>Customize Mapping</h2>
                <div>
                  <button onClick={handleGenerate}>Generate SQL</button>
                </div>
              </div>

              <form ref={formRef}>
                <table>
                  <thead>
                    <tr>
                      <th>CSV Name</th>
                      <th>SQL Name</th>
                      <th>Data Type</th>
                      <th>Include?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta?.fields?.map((field: string) => {
                      return (
                        <tr key={field}>
                          <th>
                            <label>{field}</label>
                          </th>
                          <th>
                            <input
                              type="text"
                              name={field}
                              defaultValue={sqlColumn(field)}
                            />
                          </th>
                          <th>
                            <select name={`${field}.type`}>
                              <option>text</option>
                              <option>int</option>
                              <option>bool</option>
                            </select>
                          </th>
                          <th>
                            <input
                              type="checkbox"
                              name={`${field}.include`}
                              defaultChecked
                            />
                          </th>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </form>
            </div>
            <div>
              <div className={classes.output}>
                <h4>Output</h4>
                <div>
                  <button onClick={handleClick}>
                    {copied ? "Copied SQL!" : "Copy SQL to Clipboard"}
                  </button>
                </div>
              </div>
              <textarea value={sql} readOnly rows={10} cols={100} />
            </div>
          </div>
        </>
      ) : null}

      <br />
    </div>
  );
}

function sqlColumn(name: string) {
  name = name.trim();
  name = name.replaceAll(/([a-z])([A-Z])/g, "$1 $2");
  name = name.toLowerCase();
  name = name.replaceAll(/(\W+)/g, "_");
  return name;
}

export default App;
