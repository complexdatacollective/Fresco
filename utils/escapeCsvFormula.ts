// Neutralize CSV/formula injection: a cell whose value begins with a formula
// trigger (= + - @, or a leading tab/CR) is executed as a formula when the
// exported file is opened in Excel/Google Sheets/LibreOffice. Prefixing such a
// value with a single quote forces the spreadsheet to treat it as text.
//
// Interview attribute values and participant identifiers are participant-
// controlled (and reachable unauthenticated via the onboard flow), so any CSV
// built from them must pass string cells through here before serialization.

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function escapeCsvFormula<T>(value: T): T | string {
  if (typeof value === 'string' && FORMULA_TRIGGER.test(value)) {
    return `'${value}`;
  }
  return value;
}
