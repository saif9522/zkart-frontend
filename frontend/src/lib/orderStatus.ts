import type { OrderStatus } from '@/types'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  accepted: 'Accepted',
  packing: 'Packing',
  ready: 'Ready for pickup',
  pickup: 'Picked up',
  out_for_delivery: 'Out for delivery',
  nearby: 'Nearby',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'bg-mango-100 text-mango-700',
  accepted: 'bg-mango-100 text-mango-700',
  packing: 'bg-mango-100 text-mango-700',
  ready: 'bg-forest-100 text-forest-700',
  pickup: 'bg-forest-100 text-forest-700',
  out_for_delivery: 'bg-forest-100 text-forest-700',
  nearby: 'bg-forest-100 text-forest-700',
  delivered: 'bg-forest-600 text-rice-50',
  cancelled: 'bg-chili-100 text-chili-600',
}

export const STATUS_SEQUENCE: OrderStatus[] = [
  'placed',
  'accepted',
  'packing',
  'ready',
  'pickup',
  'out_for_delivery',
  'nearby',
  'delivered',
]
