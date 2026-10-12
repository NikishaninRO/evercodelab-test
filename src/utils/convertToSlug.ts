export const convertToSlug = (str: string) => {
  return str.replace(' ', '-').toLowerCase()
}
