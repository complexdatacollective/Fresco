import { EventEmitter } from 'events';

export default class TypedEventEmitter<TEvents extends Record<string, any>> {
  private emitter = new EventEmitter();

  emit<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    ...eventArg: TEvents[TEventName]
  ) {
    this.emitter.emit(eventName, ...(eventArg as []));
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void,
  ) {
    this.emitter.on(
      eventName,
      handler as unknown as (...args: unknown[]) => void,
    );
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void,
  ) {
    this.emitter.off(
      eventName,
      handler as unknown as (...args: unknown[]) => void,
    );
  }

  removeAllListeners(eventName?: keyof TEvents & string) {
    this.emitter.removeAllListeners(eventName);
  }
}
