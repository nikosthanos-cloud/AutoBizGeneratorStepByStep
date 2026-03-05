const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ------------ Auth (admin login) ------------

export interface LoginResponse {
  user: { id: string; email: string; name: string | null; role: string };
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const msg = (err as { message?: string | string[] }).message;
    const text = Array.isArray(msg) ? msg[0] : msg;
    throw new Error(text ?? 'Login failed');
  }
  return res.json();
}

/** Send a single new message; conversation is tracked via cookie. Returns assistant reply. */
export async function postChat(message: string): Promise<{ content: string; conversationId?: string }> {
  const res = await fetch(`${API_BASE}/api/public/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message.trim() }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Chat failed: ${res.status}`);
  }
  return res.json();
}

export interface ProposalPackage {
  name: string;
  price: number;
  currency: string;
  features: string[];
}

export interface CreateLeadResponse {
  leadId: string;
  proposal: {
    starter: ProposalPackage;
    pro: ProposalPackage;
    enterprise: ProposalPackage;
  };
}

export async function createLead(payload: {
  messages: Array<{ role: string; content: string }>;
  email?: string | null;
  name?: string | null;
}): Promise<CreateLeadResponse> {
  const res = await fetch(`${API_BASE}/api/public/leads`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, source: 'web_chat' }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Create lead failed: ${res.status}`);
  }
  return res.json();
}

// ------------ Admin Leads (requires admin auth headers) ------------

export interface AdminLead {
  id: string;
  status: string;
  source: string | null;
  selectedPackage: string | null;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
}

export interface AdminLeadsResponse {
  data: AdminLead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminLeadsParams {
  page?: number;
  limit?: number;
  status?: string;
  selected_package?: string;
}

/** Call with admin user so backend receives X-User-* headers and allows access. */
export async function getAdminLeads(
  params: AdminLeadsParams,
  adminUser: { id: string; email: string; role: string },
): Promise<AdminLeadsResponse> {
  const url = new URL(`${API_BASE}/api/admin/leads`);
  if (params.page != null) url.searchParams.set('page', String(params.page));
  if (params.limit != null) url.searchParams.set('limit', String(params.limit));
  if (params.status) url.searchParams.set('status', params.status);
  if (params.selected_package) url.searchParams.set('selected_package', params.selected_package);
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: {
      'X-User-Id': adminUser.id,
      'X-User-Email': adminUser.email,
      'X-User-Role': adminUser.role,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Leads failed: ${res.status}`);
  }
  return res.json();
}

// ------------ Admin AI Settings (requires admin auth headers) ------------

export interface AIUsageLogEntry {
  id: string;
  type: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costEstimate: number | null;
  createdAt: string;
}

export interface AdminPrompts {
  sales_assistant: string;
  proposal_generator: string;
}

function adminHeaders(adminUser: { id: string; email: string; role: string }) {
  return {
    'X-User-Id': adminUser.id,
    'X-User-Email': adminUser.email,
    'X-User-Role': adminUser.role,
  };
}

export async function getAdminAiUsage(
  adminUser: { id: string; email: string; role: string },
  limit?: number,
): Promise<{ data: AIUsageLogEntry[]; total: number }> {
  const url = new URL(`${API_BASE}/api/admin/ai-usage`);
  if (limit != null) url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: adminHeaders(adminUser),
  });
  if (!res.ok) throw new Error(await res.text().then((t) => t || `Failed: ${res.status}`));
  return res.json();
}

export async function getAdminPrompts(
  adminUser: { id: string; email: string; role: string },
): Promise<AdminPrompts> {
  const res = await fetch(`${API_BASE}/api/admin/settings/prompts`, {
    credentials: 'include',
    headers: adminHeaders(adminUser),
  });
  if (!res.ok) throw new Error(await res.text().then((t) => t || `Failed: ${res.status}`));
  return res.json();
}

export async function updateAdminPrompts(
  adminUser: { id: string; email: string; role: string },
  body: AdminPrompts,
): Promise<AdminPrompts> {
  const res = await fetch(`${API_BASE}/api/admin/settings/prompts`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(adminUser) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().then((t) => t || `Failed: ${res.status}`));
  return res.json();
}

// ------------ Admin Dashboard ------------

export interface DashboardStats {
  totalLeads: number;
  conversionRate: number;
  aiCost: number;
  activeBuilds: number;
  leadsPerDay: Array<{ date: string; count: number }>;
}

export async function getDashboardStats(days?: number): Promise<DashboardStats> {
  const url = new URL(`${API_BASE}/api/admin/dashboard/stats`);
  if (days != null) url.searchParams.set('days', String(days));
  const res = await fetch(url.toString(), { credentials: 'include' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Dashboard stats failed: ${res.status}`);
  }
  return res.json();
}
