import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsObject, IsEnum, IsArray } from "class-validator";
import { Expose, Type } from "class-transformer";
import { BasePaginationDto, PaginationQueryDto, PaginationMeta } from "./page";

/**
 * Options de tri pour les requêtes de recherche
 */
export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export enum Granularity {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export class SortOption {
  @ApiProperty({
    description: "Champ sur lequel trier",
    example: "createdAt",
    type: "string",
  })
  @Expose()
  @IsString()
  field!: string;

  @ApiProperty({
    description: "Ordre de tri",
    example: SortOrder.DESC,
    enum: SortOrder,
  })
  @Expose()
  @IsEnum(SortOrder)
  order!: SortOrder;
}

/**
 * Options de groupement pour les requêtes de recherche
 */
export class GroupByOption {
  @ApiProperty({
    description: "Champ principal de groupement",
    example: "status",
    type: "string",
  })
  @Expose()
  @IsString()
  field!: string;

  @ApiProperty({
    description: "Champ granularity de groupement",
    example: Granularity.DAY,
    type: "string",
  })
  @Expose()
  @IsEnum(Granularity)
  fieldGranularity?: Granularity;
}

/**
 * Interface pour les filtres génériques
 */
export enum FilterValueType {
  STRING = "string",
  NUMBER = "number",
  DATE = "date",
  ENUM = "enum",
}

export enum FilterOperator {
  EQ = "eq",
  NEQ = "neq",
  GT = "gt",
  GTE = "gte",
  LT = "lt",
  LTE = "lte",
  BETWEEN = "between",
  IN = "in",
  NOT_IN = "not_in",
  CONTAINS = "contains",
  STARTS_WITH = "starts_with",
  ENDS_WITH = "ends_with",
  IS_NULL = "is_null",
  NOT_NULL = "not_null",
}

export class FilterRule {
  @ApiProperty({ description: "Champ (clé) à filtrer", example: "status", type: "string" })
  @Expose()
  @IsString()
  field!: string;

  @ApiProperty({ description: "Type de valeur", enum: FilterValueType })
  @Expose()
  @IsEnum(FilterValueType)
  type!: FilterValueType;

  @ApiProperty({ description: "Opérateur de filtre", enum: FilterOperator })
  @Expose()
  @IsEnum(FilterOperator)
  op!: FilterOperator;

  @ApiProperty({ description: "Valeur unique (si applicable)", required: false })
  @Expose()
  @IsOptional()
  value?: string | number | null;

  @ApiProperty({ description: "Liste de valeurs (si applicable)", required: false, type: [String] })
  @Expose()
  @IsOptional()
  @IsArray()
  values?: Array<string | number>;

  @ApiProperty({ description: "Sensibilité à la casse pour les filtres string", required: false, example: true })
  @Expose()
  @IsOptional()
  caseInsensitive?: boolean;
}

/**
 * DTO de base pour les requêtes de recherche
 * Contient tous les paramètres de recherche communs
 * À étendre par les DTOs spécifiques de chaque entité
 */
export class BaseSearchQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: "Terme de recherche général",
    example: "mot-clé",
    type: "string",
    required: false,
  })
  @Expose()
  @Type(() => String)
  @IsOptional()
  @IsString({ message: "Le terme de recherche doit être une chaîne de caractères" })
  search?: string;

  @ApiProperty({
    description: "Options de tri",
    example: [{ field: "createdAt", order: SortOrder.DESC }],
    type: "array",
    items: {
      type: "object",
      properties: {
        field: { type: "string" },
        order: { type: "string", enum: ["ASC", "DESC"] },
      },
    },
    required: false,
  })
  @Expose()
  @Type(() => SortOption)
  @IsOptional()
  sortBy?: SortOption;

  @ApiProperty({
    description: "Options de groupement",
    example: { field: "status", subField: "priority" },
    type: GroupByOption,
    required: false,
  })
  @Expose()
  @Type(() => GroupByOption)
  @IsOptional()
  groupBy?: GroupByOption;

  @ApiProperty({
    description: "Options de sous-groupement",
    example: { field: "priority" },
    type: GroupByOption,
    required: false,
  })
  @Expose()
  @Type(() => GroupByOption)
  @IsOptional()
  subGroupBy?: GroupByOption;

  @ApiProperty({
    description: "Filtres spécifiques à appliquer",
    example: [
      { field: "status", type: "enum", op: "in", values: ["Active", "Planned"] },
      { field: "createdAt", type: "date", op: "between", values: ["2025-01-01", "2025-12-31"] },
      { field: "version", type: "number", op: "gte", value: 0.2 },
      { field: "name", type: "string", op: "contains", value: "Q1", caseInsensitive: true },
    ],
    oneOf: [
      { type: "array", items: { type: "object" } },
      { type: "object", additionalProperties: true },
    ],
  })
  @Expose()
  @IsOptional()
  filters?: FilterRule[];
}

/**
 * Interface générique pour les résultats de recherche paginés
 * Compatible avec les standards REST et gRPC
 */
export interface SearchResult<T> extends PaginationMeta {
  /** Liste des éléments correspondant à la recherche */
  items: T[];
}

/**
 * Classe abstraite pour les DTOs de résultat de recherche
 * Fournit une structure standardisée pour les réponses paginées
 */
export abstract class BaseSearchResultDto<T> extends BasePaginationDto<T> {
  /**
   * Méthode utilitaire pour créer une instance de résultat de recherche
   */
  static createSearchResult<T extends BaseSearchResultDto<any>>(items: T["items"], total: number, skip: number, take: number, targetClass: new () => T): T {
    return BasePaginationDto.create(items, total, skip, take, targetClass);
  }
}

/**
 * Utilitaires pour la construction de requêtes de recherche
 */
export class SearchQueryBuilder {
  /**
   * Construit les options de tri pour Prisma
   */
  static buildSortOptions(sortOptions?: SortOption): Record<string, "asc" | "desc"> {
    if (!sortOptions) {
      return { created_at: "desc" as const }; // Tri par défaut
    }

    const sort: Record<string, "asc" | "desc"> = {};
    sort[sortOptions.field] = sortOptions.order.toLowerCase() as "asc" | "desc";

    return sort;
  }

  /**
   * Construit les conditions de recherche pour Prisma
   */
  static buildSearchConditions(search?: string, searchFields: string[] = ["name", "description"]): Record<string, any> {
    if (!search) {
      return {};
    }

    return {
      OR: searchFields.map(field => ({
        [field]: {
          contains: search,
          mode: "insensitive" as const,
        },
      })),
    };
  }

  /**
   * Applique les filtres à une requête
   */
  static applyFilters<T extends Record<string, any>>(query: T, filters?: FilterRule[]): T {
    if (!filters) {
      return query;
    }

    const where = this.buildWhereFromFilterRules(filters);
    return { ...query, ...where } as T;
  }

  /**
   * Parse une valeur selon son type
   */
  private static parseValue(value: string | number | null | undefined, type: FilterValueType): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (type) {
      case FilterValueType.NUMBER:
        return typeof value === "number" ? value : Number(value);
      case FilterValueType.DATE:
        if (typeof value === "string") {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date;
        }
        return value;
      case FilterValueType.STRING:
      case FilterValueType.ENUM:
      default:
        return value;
    }
  }

  /**
   * Parse un tableau de valeurs selon leur type
   */
  private static parseValues(values: Array<string | number> | undefined, type: FilterValueType): Array<any> | undefined {
    if (!values) return values;

    return values.map(value => this.parseValue(value, type));
  }

  /**
   * Convertit un tableau de FilterRule en conditions compatibles Prisma
   */
  static buildWhereFromFilterRules(rules: FilterRule[]): Record<string, any> {
    const where: Record<string, any> = {};

    const mergeCond = (cond: Record<string, any>) => {
      Object.entries(cond).forEach(([key, val]) => {
        if (key === "OR" || key === "AND") {
          where[key] = [...(where[key] ?? []), ...(val as any[])];
        } else if (where[key] && typeof where[key] === "object" && typeof val === "object") {
          where[key] = { ...where[key], ...val };
        } else {
          where[key] = val;
        }
      });
    };

    for (const rule of rules) {
      const f = rule.field;
      const ci = rule.caseInsensitive ? { mode: "insensitive" as const } : {};

      // Parse les valeurs selon leur type
      const parsedValue = this.parseValue(rule.value, rule.type);
      const parsedValues = this.parseValues(rule.values, rule.type);

      switch (rule.op) {
        case FilterOperator.EQ:
          mergeCond({ [f]: parsedValue });
          break;
        case FilterOperator.NEQ:
          mergeCond({ NOT: { [f]: parsedValue } });
          break;
        case FilterOperator.GT:
          mergeCond({ [f]: { gt: parsedValue } });
          break;
        case FilterOperator.GTE:
          mergeCond({ [f]: { gte: parsedValue } });
          break;
        case FilterOperator.LT:
          mergeCond({ [f]: { lt: parsedValue } });
          break;
        case FilterOperator.LTE:
          mergeCond({ [f]: { lte: parsedValue } });
          break;
        case FilterOperator.BETWEEN:
          if (parsedValues && parsedValues.length >= 2) {
            mergeCond({ [f]: { gte: parsedValues[0], lte: parsedValues[1] } });
          }
          break;
        case FilterOperator.IN:
          mergeCond({ [f]: { in: parsedValues ?? [] } });
          break;
        case FilterOperator.NOT_IN:
          mergeCond({ [f]: { notIn: parsedValues ?? [] } });
          break;
        case FilterOperator.CONTAINS:
          mergeCond({ [f]: { contains: parsedValue, ...ci } });
          break;
        case FilterOperator.STARTS_WITH:
          mergeCond({ [f]: { startsWith: parsedValue, ...ci } });
          break;
        case FilterOperator.ENDS_WITH:
          mergeCond({ [f]: { endsWith: parsedValue, ...ci } });
          break;
        case FilterOperator.IS_NULL:
          mergeCond({ [f]: null });
          break;
        case FilterOperator.NOT_NULL:
          mergeCond({ NOT: { [f]: null } });
          break;
        default:
          break;
      }
    }

    return where;
  }

  /**
   * Calcule les métadonnées de pagination
   */
  static calculatePaginationMeta(total: number, skip: number, take: number): PaginationMeta {
    return {
      total,
      skip,
      take,
      hasNext: skip + take < total,
      hasPrev: skip > 0,
    };
  }
}
