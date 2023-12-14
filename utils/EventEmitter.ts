import { EventEmitter as NodeEventEmitter } from 'events';

type EventMap = Record<string, unknown>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

type Emitter<T extends EventMap> = {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
};

export class EventEmitter<T extends EventMap> implements Emitter<T> {
  private emitter = new NodeEventEmitter();
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    this.emitter.on(eventName, fn as EventReceiver<unknown>);
  }

  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
    this.emitter.off(eventName, fn as EventReceiver<unknown>);
  }

  emit<K extends EventKey<T>>(eventName: K, params: T[K]) {
    this.emitter.emit(eventName, params);
  }
}
