"use client";

import { useActionState } from "react";
import { IconTrash } from "@/design-system/icons";
import type { InviteFormState } from "../invite-types";

const initialState: InviteFormState = {};

interface DeleteInviteFormProps {
  action: (previous: InviteFormState, formData: FormData) => Promise<InviteFormState>;
  eventId: string;
  inviteId: string;
}

export function DeleteInviteForm({ action, eventId, inviteId }: DeleteInviteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="inviteId" value={inviteId} />
      <button
        type="submit"
        aria-label="Excluir convite"
        title="Excluir convite"
        disabled={pending}
        className="inline-flex h-[33px] w-8 items-center justify-center border-2 border-stamp bg-stamp text-paper transition-colors hover:border-ink hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <IconTrash size={15} />
      </button>
      {state.error ? (
        <span role="alert" className="text-xs text-stamp">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
