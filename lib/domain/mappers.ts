import type {
  ArchitecturalStyle,
  ConstructionQuality,
  DesignPriority,
  HouseRequirements,
  Plot,
  PlotShape,
  RoadSide,
} from "@/lib/domain/types";

/**
 * Converts Supabase's snake_case row shape into the camelCase domain types
 * the rest of the app (and the design wizard) works with. Kept in one place
 * so the mapping only has to be gotten right once.
 */

type Row = Record<string, unknown>;

export function mapPlotRow(row: Row): Plot {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    widthMm: row.width_mm as number,
    lengthMm: row.length_mm as number,
    roadSide: row.road_side as RoadSide,
    northDirectionDegrees: Number(row.north_direction_degrees),
    locationCountry: row.location_country as string,
    locationState: row.location_state as string | null,
    locationCity: row.location_city as string | null,
    postalCode: row.postal_code as string | null,
    plotShape: row.plot_shape as PlotShape,
  };
}

export function mapHouseRequirementsRow(row: Row): HouseRequirements {
  return {
    floors: row.floors as number,
    bedrooms: row.bedrooms as number,
    bathrooms: row.bathrooms as number,
    kitchens: row.kitchens as number,
    parkingCars: row.parking_cars as number,
    livingRooms: row.living_rooms as number,
    diningRooms: row.dining_rooms as number,
    pujaRoom: row.puja_room as boolean,
    homeOffice: row.home_office as boolean,
    balcony: row.balcony as boolean,
    terrace: row.terrace as boolean,
    utilityRoom: row.utility_room as boolean,
    storeRoom: row.store_room as boolean,
    laundryRoom: row.laundry_room as boolean,
    vastuEnabled: row.vastu_enabled as boolean,
    designPriorities: (row.design_priorities ?? []) as DesignPriority[],
    architecturalStyle: row.architectural_style as ArchitecturalStyle,
    constructionQuality: row.construction_quality as ConstructionQuality,
    budgetMin: row.budget_min == null ? null : Number(row.budget_min),
    budgetMax: row.budget_max == null ? null : Number(row.budget_max),
    currency: row.currency as string,
    additionalRequirements: row.additional_requirements as string,
  };
}
