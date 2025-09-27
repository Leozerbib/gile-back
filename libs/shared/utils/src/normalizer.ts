/**
 * Utilitaires de normalisation des données
 */

/**
 * Valeurs considérées comme "vides" qui seront converties en null
 */
const EMPTY_VALUES = new Set(["", "null", "undefined", "NULL", "UNDEFINED"]);

/**
 * Type pour représenter les valeurs qui peuvent être nullifiées
 */
type Nullable<T> = T extends string ? string | null : T;

/**
 * Type pour normaliser récursivement un type
 */
type Normalized<T> = T extends (infer U)[] ? Normalized<U>[] : T extends Record<string, any> ? { [K in keyof T]: Normalized<T[K]> } : Nullable<T>;

/**
 * Type pour préserver les champs requis d'un objet Prisma
 */
type PrismaRequiredFields<T> = {
  [K in keyof T]: T[K] extends string | null | undefined ? never : K;
}[keyof T];

/**
 * Type pour normaliser un objet Prisma en préservant les champs requis
 */
type PrismaNormalized<T> =
  T extends Record<string, any>
    ? {
        [K in keyof T as K extends PrismaRequiredFields<T> ? K : never]: T[K];
      } & {
        [K in keyof T as K extends PrismaRequiredFields<T> ? never : K]: Normalized<T[K]>;
      }
    : T;

/**
 * Vérifie si une valeur est considérée comme vide
 * @param value La valeur à tester
 * @returns true si la valeur est vide
 */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return EMPTY_VALUES.has(value.toLowerCase().trim());
  }

  return false;
}

/**
 * Normalise une valeur en convertissant les valeurs vides en null
 * @param value La valeur à normaliser
 * @returns La valeur normalisée
 */
function normalizeValue(value: unknown): unknown {
  if (isEmptyValue(value)) {
    return null;
  }

  // Si c'est un objet, on le normalise récursivement
  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return value.map(normalizeValue);
    }

    const normalizedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      normalizedObj[key] = normalizeValue(val);
    }
    return normalizedObj;
  }

  return value;
}

/**
 * Normalise un objet en convertissant les valeurs vides en null
 *
 * Exemples de conversions:
 * - "" → null
 * - "null" → null
 * - "undefined" → null
 * - "NULL" → null
 * - "UNDEFINED" → null
 *
 * @param obj L'objet à normaliser
 * @returns L'objet normalisé avec les types préservés
 *
 * @example
 * ```typescript
 * const data: {
 *   name: string;
 *   description?: string;
 *   metadata: {
 *     tags?: string;
 *     category: string;
 *   };
 * } = {
 *   name: "John",
 *   description: "",
 *   metadata: {
 *     tags: "",
 *     category: "user"
 *   }
 * };
 *
 * const normalized = normalizeObject(data);
 * // normalized.description est maintenant `null`
 * // normalized.metadata.tags est maintenant `null`
 * ```
 */
export function normalizeObject<T extends Record<string, any>>(obj: T): Normalized<T> {
  if (obj === null || typeof obj !== "object") {
    throw new Error("normalizeObject: Le paramètre doit être un objet non-null");
  }

  return normalizeValue(obj) as Normalized<T>;
}

/**
 * Version plus stricte qui ne normalise que les chaînes vides (sans les "null", "undefined")
 * @param obj L'objet à normaliser
 * @returns L'objet normalisé
 */
export function normalizeEmptyStrings<T extends Record<string, any>>(obj: T): Normalized<T> {
  function normalizeStrict(value: unknown): unknown {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }

    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.map(normalizeStrict);
      }

      const normalizedObj: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        normalizedObj[key] = normalizeStrict(val);
      }
      return normalizedObj;
    }

    return value;
  }

  return normalizeStrict(obj) as Normalized<T>;
}

/**
 * Normalise un objet en préservant les champs requis
 * Les champs requis restent des strings non-null, les champs optionnels peuvent devenir null
 *
 * @param obj L'objet à normaliser
 * @param requiredFields Liste des champs requis qui ne doivent pas être nullifiés
 * @returns L'objet normalisé
 */
export function normalizeWithRequiredFields<T extends Record<string, any>>(obj: T, requiredFields: (keyof T)[]): T {
  if (obj === null || typeof obj !== "object") {
    throw new Error("normalizeWithRequiredFields: Le paramètre doit être un objet non-null");
  }

  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (requiredFields.includes(key as keyof T)) {
      // Champs requis : garder la valeur originale si c'est une string non-vide
      if (typeof value === "string" && EMPTY_VALUES.has(value.toLowerCase().trim())) {
        throw new Error(`Champ requis '${key}' ne peut pas être vide`);
      }
      normalized[key] = value;
    } else {
      // Champs optionnels : normaliser normalement
      normalized[key] = normalizeValue(value);
    }
  }

  return normalized as T;
}
