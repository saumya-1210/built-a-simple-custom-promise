# Custom Promise Implementation

A simplified implementation of JavaScript's `Promise` built from scratch using **TypeScript**.

The goal of this project is to understand how Promises work internally by implementing their core behavior without relying on the native `Promise` API.

## Features

- Promise state management
  - `PENDING`
  - `FULFILLED`
  - `REJECTED`
- Generic success and rejection types
- Custom `resolve()` and `reject()` functions
- `.then()` support
- `.catch()` support
- `.finally()` support
- Callback queues for pending Promises
- Promise chaining
- Basic error propagation
- Protection against multiple Promise settlements

## How It Works

A Promise starts in the `PENDING` state and can transition only once:

```text
              PENDING
              /     \
             ↓       ↓
        FULFILLED  REJECTED
```

Once a Promise is settled, it cannot transition to another state.

### Fulfillment Flow

When `resolve(value)` is called:

```text
resolve(value)
      ↓
PENDING → FULFILLED
      ↓
store resolved value
      ↓
execute pending .then() callbacks
      ↓
execute .finally()
```

### Rejection Flow

When `reject(reason)` is called:

```text
reject(reason)
      ↓
PENDING → REJECTED
      ↓
store rejection reason
      ↓
execute pending .catch() callbacks
      ↓
execute .finally()
```

## Generic Types

The Promise implementation uses two generic types:

```ts
class MyPromise<T, K>
```

Where:

- `T` represents the type of the resolved value.
- `K` represents the type of the rejection reason.

For example:

```ts
MyPromise<number, string>
```

represents a Promise that:

- resolves → `number`
- rejects → `string`

## Executor

The constructor accepts an executor function:

```ts
new MyPromise((resolve, reject) => {
    // asynchronous operation
});
```

The executor receives two functions:

```text
executor
   │
   ├── resolve → _promiseResolver()
   │
   └── reject  → _promiseRejector()
```

The resolver and rejector are bound to the current `MyPromise` instance using `.bind(this)`.

## Callback Queues

When `.then()` or `.catch()` is called while the Promise is still pending, the callback cannot be executed immediately.

Instead, it is stored in a callback queue.

For example:

```ts
const promise = waitFor(5);

promise.then((value) => {
    console.log(value);
});
```

While the timer is running:

```text
_state = PENDING

_successCallbackHandler
    └── callback
```

Once the Promise resolves:

```text
resolve(5)
    ↓
_state = FULFILLED
    ↓
execute stored callback
```

This allows callbacks to be registered before an asynchronous operation finishes.

## `.then()`

`.then()` handles successful Promise completion.

- If the Promise is already fulfilled, the callback is executed immediately.
- If the Promise is still pending, the callback is stored and executed when the Promise is fulfilled.

The important part of chaining is that `.then()` creates and returns a new Promise.

```text
Promise 1
    │
    │ .then()
    ↓
Promise 2
    │
    │ .then()
    ↓
Promise 3
```

The return value of one `.then()` becomes the resolved value of the next Promise.

### Example

```ts
waitFor(2)
    .then((value) => {
        console.log("First:", value);
        return value * 2;
    })
    .then((value) => {
        console.log("Second:", value);
        return value + 10;
    })
    .then((value) => {
        console.log("Third:", value);
    });
```

Output:

```text
First: 2
Second: 4
Third: 14
```

The flow is:

```text
waitFor(2)
    ↓
Promise 1 resolves with 2
    ↓
First .then()
    ↓
return 2 * 2
    ↓
Promise 2 resolves with 4
    ↓
Second .then()
    ↓
return 4 + 10
    ↓
Promise 3 resolves with 14
    ↓
Third .then()
```

## Promise Chaining

Promise chaining is implemented by returning a new `MyPromise` from `.then()`:

```ts
public then<R>(
    handlerFn: PromiseThen<T, R>
): MyPromise<R, K> {
    return new MyPromise<R, K>((resolve, reject) => {
        // ...
    });
}
```

When the callback executes:

```ts
const result = handlerFn(value);
resolve(result);
```

the returned value is used to resolve the new Promise.

Conceptually:

```text
Previous Promise
       │
       │ value
       ↓
   handlerFn()
       │
       │ result
       ↓
 resolve(result)
       │
       ↓
 New Promise
```

This allows:

```ts
promise
    .then(...)
    .then(...)
    .then(...);
```

where each `.then()` operates on the result of the previous one.

## Error Propagation

Errors thrown inside a `.then()` callback are caught and used to reject the Promise returned by that `.then()`.

```ts
waitFor(2)
    .then((value) => {
        throw "Something went wrong";
    })
    .catch((reason) => {
        console.log("Caught:", reason);
    });
```

Flow:

```text
Promise fulfills
      ↓
.then() callback executes
      ↓
callback throws
      ↓
catch(error)
      ↓
reject(error)
      ↓
.catch() receives the error
```

Output:

```text
Caught: Something went wrong
```

## `.catch()`

`.catch()` handles rejected Promises.

- If the Promise is already rejected, the handler executes immediately.
- If the Promise is pending, the handler is stored until rejection occurs.
- If the Promise is fulfilled, the fulfilled value is passed through to the next Promise in the chain.

### Example

```ts
customPromise()
    .then(() => {
        console.log("Success");
    })
    .catch((reason) => {
        console.log("Caught:", reason);
        return "Recovered";
    })
    .then((value) => {
        console.log("After catch:", value);
    });
```

Output:

```text
Caught: Okay
After catch: Recovered
```

## `.finally()`

`.finally()` runs after the Promise settles, regardless of whether it was fulfilled or rejected.

```ts
promise.finally(() => {
    console.log("Done");
});
```

It can execute after either:

```text
resolve()
   ↓
finally()
```

or:

```text
reject()
   ↓
finally()
```

### Example

```ts
const waitFor = (s: number) =>
    new MyPromise<number, number>((resolve, reject) => {
        setTimeout(() => resolve(s), s * 1000);
    });

waitFor(2)
    .then((value) => {
        console.log("First:", value);
        return value * 2;
    })
    .then((value) => {
        console.log("Second:", value);
        return value + 10;
    })
    .then((value) => {
        console.log("Third:", value);
    })
    .finally(() => {
        console.log("All Good");
    });
```

Output:

```text
First: 2
Second: 4
Third: 14
All Good
```

## Architecture

The implementation can be viewed as a state machine combined with callback queues:

```text
                   MyPromise
                       │
                       ↓
                    PENDING
                   /       \
                  /         \
                 ↓           ↓
            FULFILLED     REJECTED
                 │           │
                 ↓           ↓
             _value       _reason
                 │           │
                 ↓           ↓
            .then()       .catch()
                 │           │
                 └─────┬─────┘
                       ↓
                    finally
```

### Chaining Architecture

```text
       MyPromise<T>
            │
            │ .then(T → R)
            ↓
       MyPromise<R>
            │
            │ .then(R → P)
            ↓
       MyPromise<P>
```

Each `.then()` transforms one Promise into another Promise.

## Implementation Details

### State

The current state is stored in:

```ts
private _state: PromiseState = PromiseState.PENDING;
```

### Resolved Value

The successful result is stored in:

```ts
private _value: T | undefined = undefined;
```

### Rejection Reason

The rejection reason is stored in:

```ts
private _reason: K | undefined = undefined;
```

### Success Callbacks

Callbacks waiting for fulfillment are stored in:

```ts
private _successCallbackHandler: ((value: T) => void)[] = [];
```

### Failure Callbacks

Callbacks waiting for rejection are stored in:

```ts
private _failureCallbackHandler: ((reason: K) => void)[] = [];
```

## Current Limitations

This is still a simplified implementation and does not completely replicate the native JavaScript Promise specification.

The following advanced behaviors are not fully implemented yet:

- Returning another Promise from `.then()`
- Thenable assimilation
- Complete Promise resolution procedure
- Full `.finally()` chaining behavior
- Static methods such as `Promise.resolve()`
- Static methods such as `Promise.reject()`
- `Promise.all()`
- `Promise.race()`
- `Promise.allSettled()`
- `Promise.any()`
- Microtask queue behavior identical to native Promises

## Future Improvements

- [ ] Handle callbacks that return another `MyPromise`
- [ ] Implement proper Promise resolution / thenable assimilation
- [ ] Improve `.finally()` chaining
- [ ] Implement `MyPromise.resolve()`
- [ ] Implement `MyPromise.reject()`
- [ ] Implement `MyPromise.all()`
- [ ] Implement `MyPromise.race()`
- [ ] Implement `MyPromise.allSettled()`
- [ ] Implement `MyPromise.any()`
- [ ] Match native Promise microtask behavior

## Learning Goal

The goal of this project is to understand how JavaScript Promises work internally by implementing them from scratch.

The implementation covers the progression:

```text
Promise States
      ↓
resolve / reject
      ↓
Callback Registration
      ↓
Callback Queues
      ↓
.then() / .catch()
      ↓
Promise Chaining
      ↓
Error Propagation
```

Rather than treating Promises as a black box, this project explores how their core behavior can be constructed using TypeScript classes, state management, callbacks, and asynchronous execution.

## Tech Stack

- TypeScript
- JavaScript Runtime
- `setTimeout`

## Status

🚧 **Work in Progress**

The project currently supports:

- Promise state management
- Resolution and rejection
- `.then()`
- `.catch()`
- `.finally()`
- Basic Promise chaining
- Basic error propagation

Advanced Promise resolution behavior and static Promise methods are planned for future iterations.
