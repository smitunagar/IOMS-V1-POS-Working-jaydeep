import { EventEmitter } from 'events';

type ScheduledOrderEvent = {
  id: string | null;
  orderId: string;
  pickupLocation: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  items: Array<Record<string, any>>;
  source?: string;
  createdAt: string;
};

const emitter = new EventEmitter();

export function publishScheduledOrder(event: ScheduledOrderEvent) {
  emitter.emit('scheduled-order', event);
}

export function subscribeScheduledOrders(listener: (event: ScheduledOrderEvent) => void) {
  emitter.on('scheduled-order', listener);
  return () => emitter.off('scheduled-order', listener);
}
