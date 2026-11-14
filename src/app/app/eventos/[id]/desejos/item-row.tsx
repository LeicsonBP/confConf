"use client";

import { useActionState, useState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { WISHLIST_PRIORITIES, priorityLabel } from "@/modules/wishlist/domain/wishlist-item";
import type { WishlistFormState } from "./types";

interface WishlistItem {
  id: string;
  title: string;
  notes: string | null;
  url: string | null;
  priority: number;
}

interface WishlistItemRowProps {
  item: WishlistItem;
  eventId: string;
  updateAction: (previous: WishlistFormState, formData: FormData) => Promise<WishlistFormState>;
  deleteAction: (previous: WishlistFormState, formData: FormData) => Promise<WishlistFormState>;
}

export function WishlistItemRow({ item, eventId, updateAction, deleteAction }: WishlistItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateFormAction, updating] = useActionState(updateAction, {});
  const [deleteState, deleteFormAction, deleting] = useActionState(deleteAction, {});

  return (
    <li className="border-2 border-ink bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg leading-tight">{item.title}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Prioridade {priorityLabel(item.priority)}
          </p>
          {item.notes ? (
            <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{item.notes}</p>
          ) : null}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2 inline-block text-sm underline decoration-2 underline-offset-4"
            >
              Ver link
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => setEditing((value) => !value)}>
            {editing ? "Fechar" : "Editar"}
          </Button>
          <form action={deleteFormAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="itemId" value={item.id} />
            <Button type="submit" variant="danger" disabled={deleting}>
              {deleting ? "Removendo..." : "Remover"}
            </Button>
          </form>
        </div>
      </div>

      {deleteState.error ? (
        <p role="alert" className="mt-2 text-sm text-stamp">
          {deleteState.error}
        </p>
      ) : null}

      {editing ? (
        <form
          action={updateFormAction}
          className="mt-5 flex flex-col gap-4 border-t-2 border-dashed border-ink-faint pt-5"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="itemId" value={item.id} />

          <Field label="Presente" htmlFor={`title-${item.id}`} required>
            <input
              id={`title-${item.id}`}
              name="title"
              type="text"
              maxLength={120}
              defaultValue={item.title}
              required
              className={inputClassName}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link (opcional)" htmlFor={`url-${item.id}`}>
              <input
                id={`url-${item.id}`}
                name="url"
                type="url"
                maxLength={500}
                defaultValue={item.url ?? ""}
                className={inputClassName}
              />
            </Field>

            <Field label="Prioridade" htmlFor={`priority-${item.id}`}>
              <select
                id={`priority-${item.id}`}
                name="priority"
                defaultValue={String(item.priority)}
                className={inputClassName}
              >
                {WISHLIST_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Observações (opcional)" htmlFor={`notes-${item.id}`}>
            <textarea
              id={`notes-${item.id}`}
              name="notes"
              rows={2}
              maxLength={500}
              defaultValue={item.notes ?? ""}
              className={inputClassName}
            />
          </Field>

          {updateState.error ? (
            <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
              {updateState.error}
            </p>
          ) : null}

          {updateState.success ? (
            <p role="status" className="border-2 border-bottle px-4 py-3 text-sm text-bottle">
              Presente atualizado.
            </p>
          ) : null}

          <div>
            <Button type="submit" disabled={updating}>
              {updating ? "Salvando..." : "Salvar presente"}
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
