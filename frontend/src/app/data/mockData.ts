export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  stock?: number;
  variants?: { name: string; price: number }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: {
    product: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
  status: "pending" | "cooking" | "ready" | "delivered" | "cancelled";
  total: number;
  createdAt: Date;
  table?: string;
  priority?: "low" | "medium" | "high";
}

export const categories = [
  { id: "1", name: "Entradas", icon: "🥗" },
  { id: "2", name: "Platos Principales", icon: "🍽️" },
  { id: "3", name: "Bebidas", icon: "🥤" },
  { id: "4", name: "Postres", icon: "🍰" },
  { id: "5", name: "Combos", icon: "🎁" },
];

export const products: Product[] = [
  // Entradas
  {
    id: "1",
    name: "Ensalada César",
    category: "Entradas",
    price: 18.9,
    stock: 45,
  },
  {
    id: "2",
    name: "Tequeños",
    category: "Entradas",
    price: 15.5,
    stock: 30,
  },
  {
    id: "3",
    name: "Causa Limeña",
    category: "Entradas",
    price: 22.0,
    stock: 25,
  },
  
  // Platos Principales
  {
    id: "4",
    name: "Lomo Saltado",
    category: "Platos Principales",
    price: 35.0,
    stock: 20,
    variants: [
      { name: "Regular", price: 35.0 },
      { name: "Premium", price: 45.0 },
    ],
  },
  {
    id: "5",
    name: "Ceviche Mixto",
    category: "Platos Principales",
    price: 42.0,
    stock: 18,
  },
  {
    id: "6",
    name: "Arroz con Pollo",
    category: "Platos Principales",
    price: 28.0,
    stock: 35,
  },
  {
    id: "7",
    name: "Tallarines Verdes",
    category: "Platos Principales",
    price: 30.0,
    stock: 22,
  },
  {
    id: "8",
    name: "Seco de Res",
    category: "Platos Principales",
    price: 32.0,
    stock: 15,
  },
  
  // Bebidas
  {
    id: "9",
    name: "Chicha Morada",
    category: "Bebidas",
    price: 8.0,
    stock: 50,
  },
  {
    id: "10",
    name: "Inca Kola",
    category: "Bebidas",
    price: 6.0,
    stock: 60,
  },
  {
    id: "11",
    name: "Limonada Frozen",
    category: "Bebidas",
    price: 10.0,
    stock: 40,
  },
  {
    id: "12",
    name: "Pisco Sour",
    category: "Bebidas",
    price: 25.0,
    stock: 30,
  },
  
  // Postres
  {
    id: "13",
    name: "Suspiro Limeño",
    category: "Postres",
    price: 12.0,
    stock: 20,
  },
  {
    id: "14",
    name: "Mazamorra Morada",
    category: "Postres",
    price: 8.0,
    stock: 25,
  },
  {
    id: "15",
    name: "Picarones",
    category: "Postres",
    price: 10.0,
    stock: 18,
  },
  
  // Combos
  {
    id: "16",
    name: "Combo Familiar",
    category: "Combos",
    price: 85.0,
    stock: 10,
  },
  {
    id: "17",
    name: "Combo Ejecutivo",
    category: "Combos",
    price: 45.0,
    stock: 15,
  },
];

export const orders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customer: "Mesa 5",
    items: [
      { product: "Lomo Saltado", quantity: 2, price: 35.0 },
      { product: "Chicha Morada", quantity: 2, price: 8.0 },
    ],
    status: "cooking",
    total: 86.0,
    createdAt: new Date(Date.now() - 15 * 60000),
    table: "5",
    priority: "medium",
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customer: "Mesa 3",
    items: [
      { product: "Ceviche Mixto", quantity: 1, price: 42.0 },
      { product: "Pisco Sour", quantity: 2, price: 25.0 },
    ],
    status: "ready",
    total: 92.0,
    createdAt: new Date(Date.now() - 25 * 60000),
    table: "3",
    priority: "high",
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customer: "Mesa 8",
    items: [
      { product: "Combo Familiar", quantity: 1, price: 85.0 },
    ],
    status: "pending",
    total: 85.0,
    createdAt: new Date(Date.now() - 5 * 60000),
    table: "8",
    priority: "low",
  },
];

export const salesData = [
  { day: "Lun", ventas: 1200 },
  { day: "Mar", ventas: 1450 },
  { day: "Mié", ventas: 1680 },
  { day: "Jue", ventas: 1890 },
  { day: "Vie", ventas: 2340 },
  { day: "Sáb", ventas: 2850 },
  { day: "Dom", ventas: 2650 },
];

export const categorySales = [
  { name: "Platos Principales", value: 45 },
  { name: "Bebidas", value: 25 },
  { name: "Entradas", value: 15 },
  { name: "Postres", value: 10 },
  { name: "Combos", value: 5 },
];
