import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  const describedBy = [hint ? `${htmlFor}-hint` : null, error ? `${htmlFor}-error` : null]
    .filter(Boolean)
    .join(" ");

  const control =
    isValidElement(children) && typeof children.type === "string"
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          "aria-describedby": describedBy || undefined,
          "aria-invalid": error ? true : undefined,
        })
      : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft"
      >
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {control}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm font-medium text-stamp">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName =
  "w-full border-2 border-ink bg-paper px-3 py-2.5 text-base text-ink placeholder:text-ink-faint focus:bg-paper-2";
