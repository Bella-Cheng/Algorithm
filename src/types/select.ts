/** SelectField 的單一選項 */
export interface SelectOption<V extends string | number = string | number> {
  label: string
  value: V
}
