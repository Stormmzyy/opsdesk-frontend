// Types for the users feature.

// A user from GET /api/v1/users, shaped exactly like the User object in
// API_CONTRACT.md. (It used to be JSONPlaceholder's shape, which also had
// website, address.geo and company.catchPhrase/bs; the contract left those
// out because nothing here used them.)
//
// phone, the address fields and the company name are always present, but can
// be empty strings: the backend has no source for them yet (opsdesk-backend
// NOTES.md, decision 15). Components must not show an empty one as if it
// were a value.
export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  address: UserAddress
  company: UserCompany
}

export interface UserAddress {
  street: string
  suite: string
  city: string
  zipcode: string
}

export interface UserCompany {
  name: string
}
