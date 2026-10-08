import { computed, reactive } from "vue";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import html2canvas from "html2canvas";
import { hasAuthHashToken, parseHashTokens } from "./authCallback";

export type AssetRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  preview: string;
  config: Record<string, unknown> | null;
  price_twd: number;
  revenue_share_percent: number;
  tags: string[];
  updated_at: string;
  created_at: string;
  is_public: boolean;
  is_official: boolean;
};

export type CreatorAnalyticsOrder = {
  id: string;
  assetId: string;
  assetName: string;
  amountTwd: number;
  status: string;
  createdAt: string;
};

export type CreatorAnalytics = {
  mode: "live" | "fallback";
  publishedCount: number;
  draftCount: number;
  paidOrderCount: number;
  installCount: number;
  grossRevenueTwd: number;
  creatorRevenueTwd: number;
  recentOrders: CreatorAnalyticsOrder[];
  note: string;
  updatedAt: string | null;
};

export type CreatorPayoutLedgerEntry = {
  id: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  grossRevenueTwd: number;
  creatorSharePercent: number;
  creatorShareTwd: number;
  platformFeeTwd: number;
  payoutAmountTwd: number;
  payoutStatus: "pending" | "approved" | "paid" | "reversed" | "cancelled";
  payoutMethod: string;
  payoutReference: string | null;
  notes: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreatorDashboardResponse = {
  ok: boolean;
  analytics?: {
    publishedCount: number;
    draftCount: number;
    paidOrderCount: number;
    installCount: number;
    grossRevenueTwd: number;
    creatorRevenueTwd: number;
    recentOrders: CreatorAnalyticsOrder[];
    updatedAt: string | null;
  };
  error?: string;
  message?: string;
};

type CreatorPayoutLedgerRow = {
  id: string;
  period_start: string;
  period_end: string;
  currency: string;
  gross_revenue_twd: number;
  creator_share_percent: number;
  creator_share_twd: number;
  platform_fee_twd: number;
  payout_amount_twd: number;
  payout_status: CreatorPayoutLedgerEntry["payoutStatus"];
  payout_method: string;
  payout_reference: string | null;
  notes: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type SessionType = Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>["data"]["session"];

export type PreviewStore = {
  workspace: { id: string; name: string };
  spaces: { id: string; name: string }[];
  activeSpaceId: string;
  collections: { id: string; name: string; tabs: { id: string; title: string }[] }[];
  openTabs: { id: string; title: string }[];
};

type PreviewBridge = {
  frame: Window | null;
  origin: string | null;
};

const previewBridge: PreviewBridge = {
  frame: null,
  origin: null,
};

export type PaintMode = "solid" | "gradient" | "image";
export type GradientStop = { id: string; color: string; position: number };
export type GradientConfig = { angle: number; stops: GradientStop[] };
export type ImageConfig = {
  url: string;
  positionX: number;
  positionY: number;
  repeat: string;
  attachment: string;
  opacity: number;
};
export type PaintConfig = {
  mode: PaintMode;
  color: string;
  opacity: number;
  gradient: GradientConfig;
  image: ImageConfig;
};
export type EditorState = {
  base: {
    text: string;
    textMuted: string;
    border: string;
    shadow: string;
    accent: string;
  };
  sections: Record<string, PaintConfig>;
};
export type TokenSet = {
  background: string;
  backgroundImageOpacity?: number;
  panel: string;
  leftPanelBackground?: string;
  leftPanelImageOpacity?: number;
  mainPanelBackground?: string;
  mainPanelImageOpacity?: number;
  rightPanelBackground?: string;
  rightPanelImageOpacity?: number;
  panelMuted?: string;
  dockImageOpacity?: number;
  border: string;
  shadow: string;
  text: string;
  textMuted: string;
  accent: string;
};

type StatusTone = "success" | "error" | "info";

type SupabaseWindowConfig = {
  __SUPABASE_URL__?: string;
  __SUPABASE_ANON_KEY__?: string;
};

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  ((window as SupabaseWindowConfig).__SUPABASE_URL__ ?? "") ||
  "";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  ((window as SupabaseWindowConfig).__SUPABASE_ANON_KEY__ ?? "") ||
  "";
let supabase: SupabaseClient | null = null;

const getSupabase = () => {
  if (supabase) return supabase;
  if (!supabaseUrl || !supabaseAnonKey) {
    creatorState.configMissing = true;
    return null;
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
};

const emptyAnalytics = (): CreatorAnalytics => ({
  mode: "fallback",
  publishedCount: 0,
  draftCount: 0,
  paidOrderCount: 0,
  installCount: 0,
  grossRevenueTwd: 0,
  creatorRevenueTwd: 0,
  recentOrders: [],
  note: "尚未載入收益資料。",
  updatedAt: null,
});

const defaultPaint = (color: string): PaintConfig => ({
  mode: "solid",
  color,
  opacity: 1,
  gradient: {
    angle: 135,
    stops: [
      { id: "g1", color: "#1f2937", position: 0 },
      { id: "g2", color: "#0b1222", position: 100 },
    ],
  },
  image: {
    url: "",
    positionX: 50,
    positionY: 50,
    repeat: "no-repeat",
    attachment: "scroll",
    opacity: 0.1,
  },
});

export const makeEditorState = (): EditorState => ({
  base: {
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    border: "#334155",
    shadow: "#0f172a",
    accent: "#f43f5e",
  },
  sections: {
    root: defaultPaint("#0b1222"),
    left: defaultPaint("#0f172a"),
    main: defaultPaint("#111827"),
    right: defaultPaint("#0f172a"),
    dock: defaultPaint("rgba(15,23,42,0.7)"),
  },
});

const cloneEditorState = (editor: EditorState): EditorState => JSON.parse(JSON.stringify(editor)) as EditorState;

const makeFallbackPreviewStore = (): PreviewStore => ({
  workspace: { id: "preview-workspace", name: "Main Workspace" },
  spaces: [
    { id: "space-personal", name: "Personal" },
    { id: "space-work", name: "Work" },
    { id: "space-side", name: "Design Lab" },
  ],
  activeSpaceId: "space-personal",
  collections: [
    {
      id: "collection-1",
      name: "AI Research",
      tabs: [
        { id: "tab-1", title: "OpenAI Docs" },
        { id: "tab-2", title: "Supabase Auth" },
      ],
    },
    {
      id: "collection-2",
      name: "Launch Tasks",
      tabs: [
        { id: "tab-3", title: "Pricing copy" },
        { id: "tab-4", title: "Chrome Store assets" },
      ],
    },
  ],
  openTabs: [
    { id: "open-1", title: "Theme Store Overview" },
    { id: "open-2", title: "Creator payout SOP" },
    { id: "open-3", title: "Support inbox" },
    { id: "open-4", title: "Vercel deployment" },
  ],
});

const formatDateSafe = (value?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return "尚未更新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚未更新";
  return date.toLocaleString("zh-TW", options ?? { year: "numeric", month: "short", day: "numeric" });
};

const setStatus = (message: string, tone: StatusTone = "info") => {
  creatorState.statusMessage = message;
  creatorState.statusTone = tone;
};

const clearStatus = () => {
  creatorState.statusMessage = "";
  creatorState.statusTone = "info";
};

const buildFallbackAnalytics = (assets: AssetRecord[]): CreatorAnalytics => ({
  mode: "fallback",
  publishedCount: assets.filter((asset) => asset.is_public).length,
  draftCount: assets.filter((asset) => !asset.is_public).length,
  paidOrderCount: 0,
  installCount: 0,
  grossRevenueTwd: 0,
  creatorRevenueTwd: 0,
  recentOrders: [],
  note: "目前顯示的是作品狀態統計。真實收益需要部署 creator_dashboard Edge Function 後才會出現。",
  updatedAt: new Date().toISOString(),
});

const normalizePayoutLedgerEntry = (row: CreatorPayoutLedgerRow): CreatorPayoutLedgerEntry => ({
  id: row.id,
  periodStart: row.period_start,
  periodEnd: row.period_end,
  currency: row.currency,
  grossRevenueTwd: row.gross_revenue_twd ?? 0,
  creatorSharePercent: row.creator_share_percent ?? 0,
  creatorShareTwd: row.creator_share_twd ?? 0,
  platformFeeTwd: row.platform_fee_twd ?? 0,
  payoutAmountTwd: row.payout_amount_twd ?? 0,
  payoutStatus: row.payout_status,
  payoutMethod: row.payout_method,
  payoutReference: row.payout_reference,
  notes: row.notes ?? "",
  paidAt: row.paid_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeTags = (raw: string) =>
  raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const revenueOptions = [0, 10, 20, 30, 40, 50, 60, 70];
export const sectionOptions = [
  { key: "root", label: "整體背景" },
  { key: "left", label: "左側欄" },
  { key: "main", label: "主內容區" },
  { key: "right", label: "右側欄" },
  { key: "dock", label: "Dock" },
] as const;
export const paintModes = [
  { value: "solid", label: "單色" },
  { value: "gradient", label: "漸層" },
  { value: "image", label: "背景圖片" },
] as const;

export const creatorState = reactive({
  ready: false,
  configMissing: false,
  session: null as SessionType,
  assets: [] as AssetRecord[],
  analytics: emptyAnalytics(),
  analyticsLoading: false,
  payouts: [] as CreatorPayoutLedgerEntry[],
  payoutsLoading: false,
  editingId: null as string | null,
  previewUpload: "",
  fallbackPreview: "",
  form: {
    name: "",
    slug: "",
    description: "",
    price: 0,
    revenueShare: 70,
    tags: "",
  },
  activeSection: "root",
  previewStore: makeFallbackPreviewStore(),
  draftEditor: makeEditorState(),
  savedEditor: makeEditorState(),
  theme: (localStorage.getItem("creator_theme") as "dark" | "light") || "dark",
  statusMessage: "",
  statusTone: "info" as StatusTone,
  pendingAction: "idle" as "idle" | "loading" | "saving" | "publishing" | "deleting",
});

export const profileName = computed(
  () => creatorState.session?.user?.user_metadata?.full_name || creatorState.session?.user?.email || "訪客"
);
export const profileEmail = computed(() => creatorState.session?.user?.email || "");
export const avatarUrl = computed(() => creatorState.session?.user?.user_metadata?.avatar_url || "");
export const activePaint = computed(() => creatorState.draftEditor.sections[creatorState.activeSection]);
export const lastUpdatedLabel = computed(() => {
  if (creatorState.assets.length === 0) return "尚無更新";
  return formatDateSafe(creatorState.assets[0]?.updated_at);
});
export const publishedAssets = computed(() => creatorState.assets.filter((asset) => asset.is_public));
export const draftAssets = computed(() => creatorState.assets.filter((asset) => !asset.is_public));
export const recentAssets = computed(() => creatorState.assets.slice(0, 5));
export const designTokens = computed(() => buildTokens(creatorState.draftEditor));
export const savedTokens = computed(() => buildTokens(creatorState.savedEditor));
export const creatorHealthSummary = computed(() => ({
  totalAssets: creatorState.assets.length,
  publishedCount: publishedAssets.value.length,
  draftCount: draftAssets.value.length,
  pendingRevenue: creatorState.analytics.creatorRevenueTwd,
  pendingPayouts: creatorState.payouts.filter((entry) => entry.payoutStatus === "pending" || entry.payoutStatus === "approved").length,
  analyticsMode: creatorState.analytics.mode,
}));

export const setPreviewBridge = (frame: Window | null, origin: string | null) => {
  previewBridge.frame = frame;
  previewBridge.origin = origin;
};

export const capturePreviewFromBridge = async () => {
  if (!previewBridge.frame || !previewBridge.origin) return "";
  const origin = previewBridge.origin;
  const requestId = `preview_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return await new Promise<string>((resolve) => {
    let settled = false;
    const handler = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const payload = event.data as { type?: string; requestId?: string; dataUrl?: string };
      if (payload?.type !== "TABOARD_PREVIEW_CAPTURE_RESULT" || payload.requestId !== requestId) return;
      settled = true;
      window.removeEventListener("message", handler);
      resolve(payload.dataUrl ?? "");
    };
    window.addEventListener("message", handler);
    previewBridge.frame?.postMessage({ type: "TABOARD_PREVIEW_CAPTURE", requestId }, origin);
    window.setTimeout(() => {
      if (settled) return;
      window.removeEventListener("message", handler);
      resolve("");
    }, 2500);
  });
};

export const buildRedirectTo = () => {
  const { origin, pathname } = window.location;
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return `${origin}${normalizedPath}`;
};

export const setTheme = (mode: "dark" | "light") => {
  creatorState.theme = mode;
  localStorage.setItem("creator_theme", mode);
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.classList.toggle("light", mode === "light");
};

export const toggleTheme = () => {
  setTheme(creatorState.theme === "dark" ? "light" : "dark");
};

const cleanAuthUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  const target = `${url.origin}${url.pathname}${url.search}#/`;
  window.location.replace(target);
};

const handleAuthCallback = async (client: SupabaseClient) => {
  const hasHashToken = hasAuthHashToken(window.location.hash);
  const hasCode = new URLSearchParams(window.location.search).has("code");
  if (!hasHashToken && !hasCode) return;
  clearStatus();

  if (hasHashToken) {
    const auth = client.auth as typeof client.auth & {
      getSessionFromUrl?: (options: { storeSession: boolean }) => Promise<{
        data: { session: SessionType };
        error: { message: string } | null;
      }>;
    };

    if (typeof auth.getSessionFromUrl === "function") {
      const { data, error } = await auth.getSessionFromUrl({ storeSession: true });
      if (error) {
        setStatus(error.message, "error");
      } else if (data.session) {
        creatorState.session = data.session;
      }
      cleanAuthUrl();
      return;
    }

    const tokens = parseHashTokens(window.location.hash);
    if (tokens && typeof client.auth.setSession === "function") {
      const { data, error } = await client.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      if (error) {
        setStatus(error.message, "error");
      } else if (data.session) {
        creatorState.session = data.session;
      }
    } else {
      setStatus("登入流程版本不相容，請更新前端後再試一次。", "error");
    }
    cleanAuthUrl();
    return;
  }

  if (hasCode) {
    const { data, error } = await client.auth.exchangeCodeForSession(window.location.href);
    if (error) {
      setStatus(error.message, "error");
    } else if (data.session) {
      creatorState.session = data.session;
    }
    cleanAuthUrl();
  }
};

export const loadAssets = async () => {
  if (!creatorState.session) return;
  const client = getSupabase();
  if (!client) return;

  const { data, error } = await client
    .from("theme_assets")
    .select(
      "id,slug,name,description,preview,config,price_twd,revenue_share_percent,tags,updated_at,created_at,is_public,is_official"
    )
    .eq("author_user_id", creatorState.session.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    setStatus(error.message, "error");
    return;
  }

  creatorState.assets = (data || []) as AssetRecord[];
};

export const loadCreatorAnalytics = async () => {
  if (!creatorState.session) {
    creatorState.analytics = emptyAnalytics();
    return;
  }

  const client = getSupabase();
  if (!client) {
    creatorState.analytics = buildFallbackAnalytics(creatorState.assets);
    return;
  }

  creatorState.analyticsLoading = true;
  try {
    const { data, error } = await client.functions.invoke<CreatorDashboardResponse>("creator_dashboard", {
      body: {},
    });

    if (error || !data?.ok || !data.analytics) {
      creatorState.analytics = buildFallbackAnalytics(creatorState.assets);
      creatorState.analytics.note = data?.message || error?.message || creatorState.analytics.note;
      return;
    }

    creatorState.analytics = {
      mode: "live",
      publishedCount: data.analytics.publishedCount,
      draftCount: data.analytics.draftCount,
      paidOrderCount: data.analytics.paidOrderCount,
      installCount: data.analytics.installCount,
      grossRevenueTwd: data.analytics.grossRevenueTwd,
      creatorRevenueTwd: data.analytics.creatorRevenueTwd,
      recentOrders: data.analytics.recentOrders,
      updatedAt: data.analytics.updatedAt,
      note: "收益資料來自 server-side 聚合結果。",
    };
  } catch (error) {
    creatorState.analytics = buildFallbackAnalytics(creatorState.assets);
    creatorState.analytics.note = error instanceof Error ? error.message : creatorState.analytics.note;
  } finally {
    creatorState.analyticsLoading = false;
  }
};

export const loadCreatorPayouts = async () => {
  if (!creatorState.session) {
    creatorState.payouts = [];
    return;
  }

  const client = getSupabase();
  if (!client) {
    creatorState.payouts = [];
    return;
  }

  creatorState.payoutsLoading = true;
  try {
    const { data, error } = await client
      .from("creator_payout_ledger")
      .select(
        "id,period_start,period_end,currency,gross_revenue_twd,creator_share_percent,creator_share_twd,platform_fee_twd,payout_amount_twd,payout_status,payout_method,payout_reference,notes,paid_at,created_at,updated_at"
      )
      .order("period_end", { ascending: false })
      .limit(12);

    if (error) {
      setStatus(error.message, "error");
      creatorState.payouts = [];
      return;
    }

    creatorState.payouts = ((data ?? []) as CreatorPayoutLedgerRow[]).map(normalizePayoutLedgerEntry);
  } finally {
    creatorState.payoutsLoading = false;
  }
};

export const loadPreviewData = async () => {
  if (!creatorState.session) return;
  try {
    const client = getSupabase();
    if (!client) return;
    const { data: workspace } = await client
      .from("workspaces")
      .select("id,name")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (workspace) {
      creatorState.previewStore.workspace = { id: workspace.id, name: workspace.name };
    }
  } catch {
    // Ignore preview hydration errors.
  }
};

export const refreshCreatorData = async () => {
  await loadAssets();
  await loadPreviewData();
  await loadCreatorAnalytics();
  await loadCreatorPayouts();
};

export const initCreator = async () => {
  const client = getSupabase();
  setTheme(creatorState.theme);
  if (!client) {
    creatorState.ready = true;
    return;
  }

  await handleAuthCallback(client);
  const { data } = await client.auth.getSession();
  creatorState.session = data.session;
  creatorState.ready = true;

  if (creatorState.session) {
    await refreshCreatorData();
  }

  client.auth.onAuthStateChange((_event, newSession) => {
    creatorState.session = newSession;
    if (newSession) {
      void refreshCreatorData();
    } else {
      creatorState.assets = [];
      creatorState.analytics = emptyAnalytics();
      creatorState.payouts = [];
      resetForm();
    }
  });
};

export const loginWithGoogle = async () => {
  const client = getSupabase();
  if (!client) {
    setStatus("登入服務尚未設定完成，請先補上 Supabase 環境變數。", "error");
    return;
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildRedirectTo(),
    },
  });

  if (error) {
    setStatus(error.message, "error");
  }
};

export const logout = async () => {
  const client = getSupabase();
  if (!client) {
    setStatus("尚未設定 Supabase 環境變數。", "error");
    return;
  }
  await client.auth.signOut();
  creatorState.session = null;
};

export const formatDate = formatDateSafe;

export const formatCurrencyTwd = (amount = 0) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amount);

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized;
  const int = parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const toRgba = (hex: string, opacity: number) => {
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const buildGradient = (gradient: GradientConfig) => {
  const stops = gradient.stops.map((stop) => `${stop.color} ${Math.round(stop.position)}%`).join(", ");
  return `linear-gradient(${gradient.angle}deg, ${stops})`;
};

const buildImage = (image: ImageConfig) => {
  if (!image.url) return "";
  return `url("${image.url}") ${image.positionX}% ${image.positionY}% / cover ${image.repeat} ${image.attachment}`;
};

export const buildBackground = (paint: PaintConfig) => {
  if (paint.mode === "gradient") return buildGradient(paint.gradient);
  if (paint.mode === "image") return buildImage(paint.image) || toRgba(paint.color, paint.opacity);
  return toRgba(paint.color, paint.opacity);
};

export const buildTokens = (editor: EditorState): TokenSet => {
  const rootPaint = editor.sections.root;
  const leftPaint = editor.sections.left;
  const mainPaint = editor.sections.main;
  const rightPaint = editor.sections.right;
  const dockPaint = editor.sections.dock;
  return {
    background: buildBackground(rootPaint),
    backgroundImageOpacity: Math.round(rootPaint.image.opacity * 100),
    panel: buildBackground(rootPaint),
    leftPanelBackground: buildBackground(leftPaint),
    leftPanelImageOpacity: Math.round(leftPaint.image.opacity * 100),
    mainPanelBackground: buildBackground(mainPaint),
    mainPanelImageOpacity: Math.round(mainPaint.image.opacity * 100),
    rightPanelBackground: buildBackground(rightPaint),
    rightPanelImageOpacity: Math.round(rightPaint.image.opacity * 100),
    panelMuted: buildBackground(dockPaint),
    dockImageOpacity: Math.round(dockPaint.image.opacity * 100),
    border: editor.base.border,
    shadow: editor.base.shadow,
    text: editor.base.text,
    textMuted: editor.base.textMuted,
    accent: editor.base.accent,
  };
};

export const previewStyle = (url: string) => ({
  backgroundImage: url ? `url(${url})` : "linear-gradient(135deg, rgba(244,63,94,0.25), rgba(15,23,42,0.75))",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
});

export const setActiveSection = (key: string) => {
  creatorState.activeSection = key;
};

export const setPaintMode = (mode: PaintMode) => {
  activePaint.value.mode = mode;
};

export const ensureSlug = () => {
  if (!creatorState.form.slug && creatorState.form.name) {
    creatorState.form.slug = slugify(creatorState.form.name);
  }
};

export const applyEditorState = (target: EditorState, source: EditorState) => {
  target.base = { ...source.base };
  target.sections = Object.fromEntries(
    Object.entries(source.sections).map(([key, value]) => [key, JSON.parse(JSON.stringify(value)) as PaintConfig])
  );
};

export const resetForm = () => {
  creatorState.editingId = null;
  creatorState.form.name = "";
  creatorState.form.slug = "";
  creatorState.form.description = "";
  creatorState.form.price = 0;
  creatorState.form.revenueShare = 70;
  creatorState.form.tags = "";
  creatorState.previewUpload = "";
  creatorState.fallbackPreview = "";
  creatorState.activeSection = "root";
  applyEditorState(creatorState.draftEditor, makeEditorState());
  applyEditorState(creatorState.savedEditor, makeEditorState());
  clearStatus();
};

export const createNewAsset = () => {
  resetForm();
};

export const selectAsset = (asset: AssetRecord) => {
  creatorState.editingId = asset.id;
  creatorState.form.name = asset.name;
  creatorState.form.slug = asset.slug;
  creatorState.form.description = asset.description || "";
  creatorState.form.price = asset.price_twd || 0;
  creatorState.form.revenueShare = asset.revenue_share_percent || 70;
  creatorState.form.tags = (asset.tags || []).join(", ");
  creatorState.previewUpload = asset.preview || "";
  creatorState.fallbackPreview = asset.preview || creatorState.fallbackPreview;
  const config = (asset.config || {}) as { editor?: EditorState };
  if (config.editor) {
    applyEditorState(creatorState.draftEditor, config.editor);
    applyEditorState(creatorState.savedEditor, config.editor);
  } else {
    applyEditorState(creatorState.draftEditor, makeEditorState());
    applyEditorState(creatorState.savedEditor, makeEditorState());
  }
  clearStatus();
};

export const capturePreview = async (prefix: string) => {
  const dataUrl = await capturePreviewFromBridge();
  if (dataUrl) return dataUrl;
  const element = document.getElementById(`${prefix}Root`);
  if (!element) return "";
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
  return canvas.toDataURL("image/png");
};

const upsertAsset = async (makePublic: boolean) => {
  clearStatus();
  ensureSlug();

  if (!creatorState.form.name.trim() || !creatorState.form.slug.trim()) {
    setStatus("名稱與 slug 都是必填。", "error");
    return null;
  }

  if (!creatorState.session) {
    setStatus("請先登入後再儲存主題。", "error");
    return null;
  }

  applyEditorState(creatorState.savedEditor, cloneEditorState(creatorState.draftEditor));

  let preview = creatorState.previewUpload || creatorState.fallbackPreview;
  if (!preview) {
    preview = await capturePreview("design");
    if (preview) {
      creatorState.fallbackPreview = preview;
    }
  }

  const payload = {
    asset_type: "theme",
    slug: creatorState.form.slug.trim(),
    name: creatorState.form.name.trim(),
    description: creatorState.form.description.trim(),
    author_user_id: creatorState.session.user.id,
    author_name: profileName.value,
    is_public: makePublic,
    is_official: false,
    price_twd: Number(creatorState.form.price || 0),
    revenue_share_percent: Number(creatorState.form.revenueShare || 0),
    preview,
    tags: normalizeTags(creatorState.form.tags),
    config: {
      tokens: savedTokens.value,
      editor: creatorState.savedEditor,
    },
  };

  const client = getSupabase();
  if (!client) {
    setStatus("尚未設定 Supabase 環境變數。", "error");
    return null;
  }

  let savedAssetId = creatorState.editingId;
  if (creatorState.editingId) {
    const { data, error } = await client
      .from("theme_assets")
      .update(payload)
      .eq("id", creatorState.editingId)
      .select("id")
      .single();

    if (error) {
      setStatus(error.message, "error");
      return null;
    }
    savedAssetId = data?.id ?? creatorState.editingId;
  } else {
    const { data, error } = await client.from("theme_assets").insert(payload).select("id").single();
    if (error) {
      setStatus(error.message, "error");
      return null;
    }
    savedAssetId = data?.id ?? null;
  }

  creatorState.editingId = savedAssetId;
  await refreshCreatorData();
  const freshAsset = creatorState.assets.find((asset) => asset.id === savedAssetId) ?? null;
  if (freshAsset) {
    selectAsset(freshAsset);
  }

  setStatus(makePublic ? "主題已公開上架。" : "草稿已儲存。", "success");
  return freshAsset;
};

export const saveDraft = async () => {
  creatorState.pendingAction = "saving";
  try {
    return await upsertAsset(false);
  } finally {
    creatorState.pendingAction = "idle";
  }
};

export const publishTheme = async () => {
  creatorState.pendingAction = "publishing";
  try {
    return await upsertAsset(true);
  } finally {
    creatorState.pendingAction = "idle";
  }
};

export const setAssetVisibility = async (asset: AssetRecord, isPublic: boolean) => {
  const client = getSupabase();
  if (!client) {
    setStatus("尚未設定 Supabase 環境變數。", "error");
    return false;
  }

  creatorState.pendingAction = isPublic ? "publishing" : "saving";
  try {
    const { error } = await client.from("theme_assets").update({ is_public: isPublic }).eq("id", asset.id);
    if (error) {
      setStatus(error.message, "error");
      return false;
    }
    await refreshCreatorData();
    setStatus(isPublic ? "作品已重新公開。" : "作品已下架並改回草稿。", "success");
    return true;
  } finally {
    creatorState.pendingAction = "idle";
  }
};

export const deleteAsset = async (assetId: string) => {
  const client = getSupabase();
  if (!client) {
    setStatus("尚未設定 Supabase 環境變數。", "error");
    return false;
  }

  creatorState.pendingAction = "deleting";
  try {
    const { error } = await client.from("theme_assets").delete().eq("id", assetId);
    if (error) {
      setStatus(error.message, "error");
      return false;
    }
    if (creatorState.editingId === assetId) {
      resetForm();
    }
    await refreshCreatorData();
    setStatus("作品已刪除。", "success");
    return true;
  } finally {
    creatorState.pendingAction = "idle";
  }
};

export const onPreviewUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    creatorState.previewUpload = String(reader.result || "");
  };
  reader.readAsDataURL(file);
};

export const onImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    activePaint.value.image.url = String(reader.result || "");
  };
  reader.readAsDataURL(file);
};

export const getAssetStatusLabel = (asset: AssetRecord) => (asset.is_public ? "已上架" : "草稿");
export const getAssetStatusTone = (asset: AssetRecord) => (asset.is_public ? "emerald" : "amber");
