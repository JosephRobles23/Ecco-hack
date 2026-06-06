// Worktree C: Session Management
// Resolves which organization a WhatsApp user belongs to and produces the
// welcome message shown when a conversation starts.

import { supabase } from "../lib/supabase/client.js";

export interface SessionResult {
  org_id: string | null;
  user_id: string | null;
  is_registered: boolean;
}

/**
 * resolveSession — look up a user in Supabase by their WhatsApp phone number.
 *
 * Returns the org/user ids when the number is registered. If the user is not
 * found (or the lookup fails) returns an unregistered session so the caller can
 * fall back to the onboarding flow.
 */
export async function resolveSession(phoneNumber: string): Promise<SessionResult> {
  const unregistered: SessionResult = {
    org_id: null,
    user_id: null,
    is_registered: false,
  };

  const { data, error } = await supabase
    .from("users")
    .select("id, org_id")
    .eq("phone", phoneNumber)
    .maybeSingle();

  if (error) {
    console.error("[session-manager] resolveSession failed:", error.message);
    return unregistered;
  }

  if (!data) {
    return unregistered;
  }

  return {
    org_id: data.org_id,
    user_id: data.id,
    is_registered: true,
  };
}

/**
 * getWelcomeMessage — greeting sent at the start of a conversation, tailored to
 * whether the user's number is registered with an organization.
 */
export function getWelcomeMessage(isRegistered: boolean): string {
  if (isRegistered) {
    return "¡Hola! Soy el asistente de tu organización. Podés enviarme datos de actividades (texto, audio, fotos, planillas) o hacerme preguntas sobre tu impacto.";
  }

  return "¡Hola! No encontré tu número registrado en ninguna organización. Pedile a tu administrador que te agregue desde el dashboard.";
}
