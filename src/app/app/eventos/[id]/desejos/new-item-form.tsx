"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import { Field, inputClassName } from "@/design-system/field";
import { WISHLIST_PRIORITIES } from "@/modules/wishlist/domain/wishlist-item";
import type { WishlistFormState } from "./types";

const initialState: WishlistFormState = {};

interface NewWishlistItemFormProps {
  eventId: string;
  action: (previous: WishlistFormState, formData: FormData) => Promise<WishlistFormState>;
}

export function NewWishlistItemForm({ eventId, action }: NewWishlistItemFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Presente" htmlFor="title" required>
            <input
              id="title"
              name="title"
              type="text"
              maxLength={120}
              required
              className={inputClassName}
              placeholder="Fone de ouvido, livro, jogo…"
            />
          </Field>
        </div>

        <Field label="Link (opcional)" htmlFor="url">
          <input
            id="url"
            name="url"
            type="url"
            maxLength={500}
            className={inputClassName}
            placeholder="https://…"
          />
        </Field>

        <Field label="Prioridade" htmlFor="priority">
          <select id="priority" name="priority" defaultValue="2" className={inputClassName}>
            {WISHLIST_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Observações (opcional)" htmlFor="notes">
            <textarea
              id="notes"
              name="notes"
              rows={2}
              maxLength={500}
              className={inputClassName}
              placeholder="Cor preferida, tamanho…"
            />
          </Field>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="border-2 border-stamp px-4 py-3 text-sm text-stamp">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p role="status" className="border-2 border-bottle px-4 py-3 text-sm text-bottle">
          Presente adicionado à sua lista.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adicionando..." : "Adicionar presente"}
        </Button>
      </div>
    </form>
  );
}
