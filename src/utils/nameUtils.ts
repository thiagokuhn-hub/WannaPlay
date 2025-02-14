export const formatDisplayName = (fullName: string) => {
  const names = fullName.trim().split(' ');
  if (names.length <= 2) return fullName;

  const firstName = names[0];
  const lastName = names[names.length - 1];
  const middleNames = names.slice(1, -1).map(name => `${name[0]}.`).join(' ');

  return `${firstName} ${middleNames} ${lastName}`;
};