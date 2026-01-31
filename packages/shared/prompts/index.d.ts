export const BUSINESS_INFO: string;
export const SECURITY_RULES: string;
export const VISITOR_PROMPT: string;
export const CUSTOMER_PROMPT: string;
export const STAFF_PROMPT: string;
export const SMS_PROMPT: string;
export const VOICE_PROMPT: string;

export type AssistantMode = 'visitor' | 'customer' | 'staff' | 'sms' | 'voice';

export function buildSystemPrompt(mode: AssistantMode, additionalContext?: string): string;
export function getPersonaPrompt(mode: AssistantMode): string;
