"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
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
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Excluindo..." : "Excluir convite"}
      </Button>
      {state.error ? (
        <span role="alert" className="text-xs text-stamp">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
