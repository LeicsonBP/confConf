"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import type { InviteFormState } from "../invite-types";

const initialState: InviteFormState = {};

interface RevokeInviteFormProps {
  action: (previous: InviteFormState, formData: FormData) => Promise<InviteFormState>;
  eventId: string;
  inviteId: string;
}

export function RevokeInviteForm({ action, eventId, inviteId }: RevokeInviteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="inviteId" value={inviteId} />
      <Button type="submit" variant="ghost" disabled={pending}>
        {pending ? "Revogando..." : "Revogar"}
      </Button>
      {state.error ? (
        <span role="alert" className="text-xs text-stamp">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
