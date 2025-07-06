export const generateSegmentedID = (segmentCount: number = 4, segmentLength: number = 4): string => {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length

  for (let i = 0; i < segmentCount; i++) {
    if (i > 0) result += '-'
    for (let j = 0; j < segmentLength; j++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
  }

  return result
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keysToOmit: K[]
): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keysToOmit.includes(key as K))
  ) as Omit<T, K>
}
