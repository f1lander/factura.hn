export const blockedRoutesForGuests: RegExp[] = [
  /^\/$/, // Match EXACTLY /
  /^\/home.*/, // Every route that starts with /home
];
export const routesThatRequireCompanyData: RegExp[] = [
  /^\/home$/,
  /^\/home\/products$/,
  /^\/home\/customers$/,
];
export const blockedRoutesForUsers: RegExp[] = [
  /^\/auth.*/, // Every route that starts with /auth
];
