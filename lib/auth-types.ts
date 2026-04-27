export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  /** True once an order for this user has been marked `paid | shipped | delivered`. */
  deviceOwner: boolean;
  createdAt: number;
};

export type PublicUser = Omit<User, "passwordHash" | "passwordSalt">;

export type Order = {
  id: string;
  userId: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: number;
};
