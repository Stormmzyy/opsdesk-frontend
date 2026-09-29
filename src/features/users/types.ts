// Types for the users feature.

// A user from the JSONPlaceholder API (https://jsonplaceholder.typicode.com/users).
// The address and company come back as nested objects.
export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  address: UserAddress
  company: UserCompany
}

export interface UserAddress {
  street: string
  suite: string
  city: string
  zipcode: string
  geo: {
    lat: string
    lng: string
  }
}

export interface UserCompany {
  name: string
  catchPhrase: string
  bs: string
}
