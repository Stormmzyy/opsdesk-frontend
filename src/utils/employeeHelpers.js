// Turns "Amara Okafor" into "AO" for the photo placeholder.
export function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
