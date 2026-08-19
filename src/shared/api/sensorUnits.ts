// Sensor type → unit catalog. The metrics endpoints require the `metrics` query
// param as `"<type>,<unit>"` (the unit must be the exact one the backend expects
// for that metric). The sensor-list endpoint returns only the type (e.g.
// `mill_speed_00`), so we derive the unit here.
//
// Extracted from the Notify web-components lib (SensorTypes.mill). Keyed by the
// mill sensor base key; sensor types look like `mill_<key>_<NN>`.

const MILL_SENSOR_UNITS: Record<string, string> = {
  speed: 'rpm',
  current: 'A',
  power: 'kW',
  grinding_chamber_pressure: 'bar',
  product_out_temperature: 'C',
  grinding_energy: 'kWh',
  uptime: 'h',
  feeding_pump_speed: 'rpm',
  feeding_valve_openness: '%',
  peripheral_speed: 'm/s',
  feeding_pump_current: 'A',
  product_in_temperature: 'C',
  product_flow_speed: 'l/h',
  visualization: 'l/min',
  water_cooling_inlet_temperature: 'C',
  water_cooling_chamber_temperature: 'C',
  water_cooling_chamber_flow_speed: 'l/h',
  seal_level: '%',
  seal_air_pressure: 'bar',
  seal_temperature: 'C',
  seal_flow_speed: 'l/h',
  water_cooling_seal_temperature: 'C',
  water_cooling_shaft_temperature: 'C',
  water_cooling_shaft_flow_speed: 'l/h',
  fixed_bearing_temperature: 'C',
  rotary_bearing_temperature: 'C',
  mixer_speed: 'rpm',
  mixer_current: 'A',
  mixer_power: 'kW',
  discharge_pump_speed: 'rpm',
  discharge_pump_current: 'A',
  dynamic_viscosity: 'cP',
  product_density: 'g/cm3',
  coolant_batch_tank_temperature: 'C',
  operating_hours: 'h',
}

/** Unit for a sensor `type` like `mill_speed_00` → `rpm`. Custom sensors
 *  (`custom_sensor_id_*`) and unknowns fall back to `n/a`. */
export function unitForSensorType(type: string): string {
  const m = type.match(/^mill_(.+?)_\d+$/)
  const key = m?.[1]
  return (key && MILL_SENSOR_UNITS[key]) || 'n/a'
}

/** Build the `"<type>,<unit>"` metric param for a sensor type. */
export function metricParam(type: string): string {
  return `${type},${unitForSensorType(type)}`
}
