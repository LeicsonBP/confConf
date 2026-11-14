"use client";

import { useActionState } from "react";
import { Button } from "@/design-system/button";
import type { EventFormState } from "../types";

const initialState: EventFormState = {};

interface ResolveReportFormProps {
  action: (previous: EventFormState, formData: FormData) => Promise<EventFormState>;
  eventId: string;
  reportId: string;
}

export function ResolveReportForm({ action, eventId, reportId }: ResolveReportFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="reportId" value={reportId} />
      <Button type="submit" variant="ghost" disabled={pending}>
        {pending ? "Salvando..." : "Marcar como resolvido"}
      </Button>
      {state.error ? (
        <span role="alert" className="text-right text-xs text-stamp">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
