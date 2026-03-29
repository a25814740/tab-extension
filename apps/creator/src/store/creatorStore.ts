import { computed, reactive } from "vue";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import html2canvas from "html2canvas";

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
};

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

export const revenueOptions = [0, 10, 20, 30, 40, 50, 60, 70];
export const sectionOptions = [
  { key: "root", label: "整體背景" },
  { key: "left", label: "左側面板" },
  { key: "main", label: "主內容" },
  { key: "right", label: "右側面板" },
  { key: "dock", label: "Dock" },
];
export const paintModes = [
  { value: "solid", label: "單色" },
  { value: "gradient", label: "漸層" },
  { value: "image", label: "背景圖片" },
];

export const setPreviewBridge = (frame: Window | null, origin: string | null) => {
  previewBridge.frame = frame;
  previewBridge.origin = origin;
};

export const capturePreviewFromBridge = async () => {
  if (!previewBridge.frame || !previewBridge.origin) return "";
  const requestId = `preview_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return await new Promise<string>((resolve) => {
    let settled = false;
    const handler = (event: MessageEvent) => {
      if (event.origin !== previewBridge.origin) return;
      const payload = event.data as { type?: string; requestId?: string; dataUrl?: string };
      if (payload?.type !== "TABOARD_PREVIEW_CAPTURE_RESULT" || payload.requestId !== requestId) return;
      settled = true;
      window.removeEventListener("message", handler);
      resolve(payload.dataUrl ?? "");
    };
    window.addEventListener("message", handler);
    previewBridge.frame?.postMessage({ type: "TABOARD_PREVIEW_CAPTURE", requestId }, previewBridge.origin);
    window.setTimeout(() => {
      if (settled) return;
      window.removeEventListener("message", handler);
      resolve("");
    }, 2500);
  });
};

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

export const creatorState = reactive({
  ready: false,
  configMissing: false,
  session: null as Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>["data"]["session"],
  assets: [] as AssetRecord[],
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
  previewStore: {
    workspace: { id: "w1", name: "Main Workspace" },
    spaces: [
      { id: "s1", name: "Personal" },
      { id: "s2", name: "Work" },
      { id: "s3", name: "Projects" },
    ],
    activeSpaceId: "s1",
    collections: [
      {
        id: "c1",
        name: "AI Research",
        tabs: [
          { id: "t1", title: "OpenAI Docs" },
          { id: "t2", title: "Chrome Extensions" },
        ],
      },
      {
        id: "c2",
        name: "Weekend",
        tabs: [
          { id: "t3", title: "Travel Ideas" },
          { id: "t4", title: "Coffee beans" },
        ],
      },
    ],
    openTabs: [
      { id: "ot1", title: "Chrome 擴充功能" },
      { id: "ot2", title: "Supabase Dashboard" },
      { id: "ot3", title: "Vercel Deployments" },
      { id: "ot4", title: "Gmail" },
    ],
  } as PreviewStore,
  draftEditor: makeEditorState(),
  savedEditor: makeEditorState(),
  theme: (localStorage.getItem("creator_theme") as "dark" | "light") || "dark",
  statusMessage: "",
});

export const profileName = computed(() => creatorState.session?.user?.user_metadata?.full_name || creatorState.session?.user?.email || "使用者");
export const profileEmail = computed(() => creatorState.session?.user?.email || "");
export const avatarUrl = computed(() => creatorState.session?.user?.user_metadata?.avatar_url || "");
export const activePaint = computed(() => creatorState.draftEditor.sections[creatorState.activeSection]);
export const lastUpdatedLabel = computed(() => {
  if (creatorState.assets.length === 0) return "尚無更新";
  return formatDate(creatorState.assets[0].updated_at);
});

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
    await loadAssets();
    await loadPreviewData();
  }
  client.auth.onAuthStateChange((_event, newSession) => {
    creatorState.session = newSession;
    if (newSession) {
      loadAssets();
      loadPreviewData();
    }
  });
};

const cleanAuthUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  url.hash = "#/";
  window.history.replaceState({}, "", url.toString());
};

const handleAuthCallback = async (client: SupabaseClient) => {
  const hasHashToken = window.location.hash.includes("access_token");
  const hasCode = new URLSearchParams(window.location.search).has("code");
  if (!hasHashToken && !hasCode) return;
  creatorState.statusMessage = "";

  if (hasHashToken) {
    const { data, error } = await client.auth.getSessionFromUrl({ storeSession: true });
    if (error) {
      creatorState.statusMessage = error.message;
    } else if (data.session) {
      creatorState.session = data.session;
    }
    cleanAuthUrl();
    return;
  }

  if (hasCode) {
    const { data, error } = await client.auth.exchangeCodeForSession(window.location.href);
    if (error) {
      creatorState.statusMessage = error.message;
    } else if (data.session) {
      creatorState.session = data.session;
    }
    cleanAuthUrl();
  }
};

export const loginWithGoogle = async () => {
  const client = getSupabase();
  if (!client) {
    creatorState.statusMessage = "登入服務尚未設定，請聯絡管理者";
    return;
  }
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildRedirectTo(),
    },
  });
  if (error) {
    creatorState.statusMessage = error.message;
  }
};

export const logout = async () => {
  const client = getSupabase();
  if (!client) {
    creatorState.statusMessage = "尚未設定 Supabase 環境變數";
    return;
  }
  await client.auth.signOut();
  creatorState.session = null;
};

export const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric" });
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
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

export const savedTokens = computed(() => buildTokens(creatorState.savedEditor));
export const designTokens = computed(() => buildTokens(creatorState.draftEditor));

export const previewStyle = (url: string) => ({
  backgroundImage: url ? `url(${url})` : "none",
});

export const setActiveSection = (key: string) => {
  creatorState.activeSection = key;
};

export const setPaintMode = (mode: PaintMode) => {
  activePaint.value.mode = mode;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const ensureSlug = () => {
  if (!creatorState.form.slug && creatorState.form.name) {
    creatorState.form.slug = slugify(creatorState.form.name);
  }
};

export const applyEditorState = (target: EditorState, source: EditorState) => {
  target.base = { ...source.base };
  Object.keys(source.sections).forEach((key) => {
    target.sections[key] = JSON.parse(JSON.stringify(source.sections[key]));
  });
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
  applyEditorState(creatorState.draftEditor, makeEditorState());
  applyEditorState(creatorState.savedEditor, makeEditorState());
};

export const selectAsset = (asset: AssetRecord) => {
  creatorState.editingId = asset.id;
  creatorState.form.name = asset.name;
  creatorState.form.slug = asset.slug;
  creatorState.form.description = asset.description || "";
  creatorState.form.price = asset.price_twd || 0;
  creatorState.form.revenueShare = asset.revenue_share_percent || 70;
  creatorState.form.tags = (asset.tags || []).join(",");
  creatorState.previewUpload = asset.preview || "";
  creatorState.fallbackPreview = asset.preview || creatorState.fallbackPreview;
  const config = (asset.config || {}) as { tokens?: TokenSet; editor?: EditorState };
  if (config.editor) {
    applyEditorState(creatorState.draftEditor, config.editor);
    applyEditorState(creatorState.savedEditor, config.editor);
  } else {
    applyEditorState(creatorState.draftEditor, makeEditorState());
    applyEditorState(creatorState.savedEditor, makeEditorState());
  }
};

export const loadAssets = async () => {
  if (!creatorState.session) return;
  const client = getSupabase();
  if (!client) return;
  const { data, error } = await client
    .from("theme_assets")
    .select("id,slug,name,description,preview,config,price_twd,revenue_share_percent,tags,updated_at")
    .eq("author_user_id", creatorState.session.user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    creatorState.statusMessage = error.message;
    return;
  }
  creatorState.assets = (data || []) as AssetRecord[];
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
    // ignore
  }
};

export const capturePreview = async (prefix: string) => {
  const dataUrl = await capturePreviewFromBridge();
  if (dataUrl) return dataUrl;
  const element = document.getElementById(`${prefix}Root`);
  if (!element) return "";
  const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
  return canvas.toDataURL("image/png");
};

export const saveDraft = async () => {
  ensureSlug();
  applyEditorState(creatorState.savedEditor, JSON.parse(JSON.stringify(creatorState.draftEditor)));
  const captured = await capturePreview("design");
  if (!creatorState.previewUpload) {
    creatorState.fallbackPreview = captured || creatorState.fallbackPreview;
  }
};

export const publishTheme = async () => {
  creatorState.statusMessage = "";
  ensureSlug();
  if (!creatorState.form.name.trim() || !creatorState.form.slug.trim()) {
    creatorState.statusMessage = "名稱與 slug 必填";
    return;
  }
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
    author_user_id: creatorState.session?.user?.id,
    author_name: profileName.value,
    is_public: false,
    is_official: false,
    price_twd: creatorState.form.price,
    revenue_share_percent: creatorState.form.revenueShare,
    preview,
    tags: creatorState.form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    config: {
      tokens: savedTokens.value,
      editor: creatorState.savedEditor,
    },
  };

  if (!creatorState.session) {
    creatorState.statusMessage = "請先登入";
    return;
  }

  const client = getSupabase();
  if (!client) return;

  if (creatorState.editingId) {
    const { error } = await client.from("theme_assets").update(payload).eq("id", creatorState.editingId);
    if (error) {
      creatorState.statusMessage = error.message;
      return;
    }
  } else {
    const { error } = await client.from("theme_assets").insert(payload);
    if (error) {
      creatorState.statusMessage = error.message;
      return;
    }
  }
  await loadAssets();
  creatorState.statusMessage = "已儲存";
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
