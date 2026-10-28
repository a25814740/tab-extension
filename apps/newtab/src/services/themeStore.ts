import type { SupabaseClient } from "@toby/api-client";
import type { ThemeTokenSet } from "../theme/catalog";

type ThemeAssetRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  author_name: string;
  is_official: boolean;
  is_public: boolean;
  price_twd: number;
  preview: string;
  tags: string[] | null;
  config: Record<string, unknown> | null;
  updated_at: string;
};

type ThemePurchaseRow = {
  asset_id: string;
  status: string;
  amount_twd: number;
};

type ThemeInstallRow = {
  asset_id: string;
  workspace_id: string | null;
  is_active: boolean;
};

type ThemeInstallMutationResult = Promise<{ error: Error | null }>;
type ThemeInstallQueryResult = Promise<{ data: { id: string } | null; error: Error | null }>;
type ThemeInstallMutationBuilder = ThemeInstallMutationResult & {
  eq: (column: string, value: string | boolean) => ThemeInstallMutationBuilder;
  is: (column: string, value: null) => ThemeInstallMutationBuilder;
};
type ThemeInstallQueryBuilder = {
  eq: (column: string, value: string) => ThemeInstallQueryBuilder;
  is: (column: string, value: null) => ThemeInstallQueryBuilder;
  maybeSingle: () => ThemeInstallQueryResult;
};
type ThemeInstallTable = {
  update: (values: Record<string, unknown>) => ThemeInstallMutationBuilder;
  select: (columns: string) => ThemeInstallQueryBuilder;
  insert: (values: Record<string, unknown>) => ThemeInstallMutationResult;
};

export type ThemeMarketplaceAsset = {
  id: string;
  slug: string;
  name: string;
  description: string;
  authorName: string;
  isOfficial: boolean;
  isPublic: boolean;
  priceTwd: number;
  preview: string;
  tags: string[];
  updatedAt: string;
  tokens: ThemeTokenSet | null;
};

export type ThemeMarketplaceEntitlements = {
  purchasedIds: Set<string>;
  installedIds: Set<string>;
  activeAssetId: string | null;
};

export function buildThemeAssetCheckoutUrl(
  supabaseUrl: string,
  accessToken: string,
  assetId: string,
  locale: string
) {
  const baseUrl = supabaseUrl.trim().replace(/\/$/, "");
  const normalizedAssetId = assetId.trim();
  if (!baseUrl || !accessToken.trim() || !normalizedAssetId) {
    return null;
  }

  const params = new URLSearchParams({
    kind: "theme_asset",
    assetId: normalizedAssetId,
    token: accessToken,
    locale,
  });

  return `${baseUrl}/functions/v1/payuni_checkout?${params.toString()}`;
}

const ACCESSIBLE_PURCHASE_STATUSES = new Set(["paid", "success", "succeeded", "completed"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeThemeTokenSet(value: unknown): ThemeTokenSet | null {
  if (!isRecord(value)) {
    return null;
  }

  const background = readString(value.background);
  const panel = readString(value.panel);
  const border = readString(value.border);
  const text = readString(value.text);
  const textMuted = readString(value.textMuted);
  const accent = readString(value.accent);

  if (!background || !panel || !border || !text || !textMuted || !accent) {
    return null;
  }

  const panelMuted = readString(value.panelMuted) || panel;
  const leftPanelBackground = readString(value.leftPanelBackground) || undefined;
  const mainPanelBackground = readString(value.mainPanelBackground) || undefined;
  const rightPanelBackground = readString(value.rightPanelBackground) || undefined;

  const backgroundImageOpacity = readNumber(value.backgroundImageOpacity) ?? undefined;
  const leftPanelImageOpacity = readNumber(value.leftPanelImageOpacity) ?? undefined;
  const mainPanelImageOpacity = readNumber(value.mainPanelImageOpacity) ?? undefined;
  const rightPanelImageOpacity = readNumber(value.rightPanelImageOpacity) ?? undefined;
  const dockImageOpacity = readNumber(value.dockImageOpacity) ?? undefined;

  return {
    background,
    panel,
    panelMuted,
    border,
    text,
    textMuted,
    accent,
    ...(leftPanelBackground ? { leftPanelBackground } : {}),
    ...(mainPanelBackground ? { mainPanelBackground } : {}),
    ...(rightPanelBackground ? { rightPanelBackground } : {}),
    ...(backgroundImageOpacity !== undefined ? { backgroundImageOpacity } : {}),
    ...(leftPanelImageOpacity !== undefined ? { leftPanelImageOpacity } : {}),
    ...(mainPanelImageOpacity !== undefined ? { mainPanelImageOpacity } : {}),
    ...(rightPanelImageOpacity !== undefined ? { rightPanelImageOpacity } : {}),
    ...(dockImageOpacity !== undefined ? { dockImageOpacity } : {}),
  };
}

function extractThemeTokens(config: unknown) {
  if (!isRecord(config)) {
    return null;
  }

  const directTokens = normalizeThemeTokenSet(config);
  if (directTokens) {
    return directTokens;
  }

  return normalizeThemeTokenSet(config.tokens);
}

function mapThemeAsset(row: ThemeAssetRow): ThemeMarketplaceAsset {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    authorName: row.author_name || "Unknown",
    isOfficial: row.is_official,
    isPublic: row.is_public,
    priceTwd: row.price_twd,
    preview: row.preview,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0) : [],
    updatedAt: row.updated_at,
    tokens: extractThemeTokens(row.config),
  };
}

export function createEmptyThemeEntitlements(): ThemeMarketplaceEntitlements {
  return {
    purchasedIds: new Set<string>(),
    installedIds: new Set<string>(),
    activeAssetId: null,
  };
}

export async function fetchPublicThemeAssets(client: SupabaseClient<unknown>) {
  const { data, error } = await client
    .from("theme_assets")
    .select("id,slug,name,description,author_name,is_official,is_public,price_twd,preview,tags,config,updated_at")
    .eq("asset_type", "theme")
    .eq("is_public", true)
    .order("is_official", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ThemeAssetRow[]).map(mapThemeAsset).filter((asset) => asset.tokens);
}

export async function fetchThemeEntitlements(
  client: SupabaseClient<unknown>,
  userId: string
): Promise<ThemeMarketplaceEntitlements> {
  const [purchaseResult, installResult] = await Promise.all([
    client.from("theme_asset_purchases").select("asset_id,status,amount_twd").eq("buyer_user_id", userId),
    client.from("theme_asset_installs").select("asset_id,workspace_id,is_active").eq("user_id", userId),
  ]);

  if (purchaseResult.error) {
    throw purchaseResult.error;
  }
  if (installResult.error) {
    throw installResult.error;
  }

  const purchasedIds = new Set<string>();
  ((purchaseResult.data ?? []) as ThemePurchaseRow[]).forEach((purchase) => {
    if (ACCESSIBLE_PURCHASE_STATUSES.has((purchase.status || "").toLowerCase()) || purchase.amount_twd <= 0) {
      purchasedIds.add(purchase.asset_id);
    }
  });

  const installedRows = (installResult.data ?? []) as ThemeInstallRow[];
  const installedIds = new Set(installedRows.map((row) => row.asset_id));
  const activeRow = installedRows.find((row) => row.is_active) ?? null;

  return {
    purchasedIds,
    installedIds,
    activeAssetId: activeRow?.asset_id ?? null,
  };
}

export async function activateThemeInstall(
  client: SupabaseClient<unknown>,
  params: { userId: string; assetId: string; workspaceId: string | null }
) {
  const installTable = client.from("theme_asset_installs") as unknown as ThemeInstallTable;
  const workspaceQueryValue = params.workspaceId ?? null;
  let deactivateQuery = installTable.update({ is_active: false }).eq("user_id", params.userId);
  let existingQuery = installTable
    .select("id")
    .eq("user_id", params.userId)
    .eq("asset_id", params.assetId);

  if (workspaceQueryValue) {
    deactivateQuery = deactivateQuery.eq("workspace_id", workspaceQueryValue);
    existingQuery = existingQuery.eq("workspace_id", workspaceQueryValue);
  } else {
    deactivateQuery = deactivateQuery.is("workspace_id", null);
    existingQuery = existingQuery.is("workspace_id", null);
  }

  const [deactivateResult, existingResult] = await Promise.all([deactivateQuery, existingQuery.maybeSingle()]);

  if (deactivateResult.error) {
    throw deactivateResult.error;
  }
  if (existingResult.error) {
    throw existingResult.error;
  }

  const timestamp = new Date().toISOString();
  if (existingResult.data?.id) {
    const { error } = await installTable
      .update({
        is_active: true,
        installed_at: timestamp,
        updated_at: timestamp,
      })
      .eq("id", existingResult.data.id);
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await installTable.insert({
    asset_id: params.assetId,
    user_id: params.userId,
    workspace_id: workspaceQueryValue,
    is_active: true,
    installed_at: timestamp,
    updated_at: timestamp,
  });

  if (error) {
    throw error;
  }
}
