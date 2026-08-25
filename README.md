# Custom Promise Implementation

A simplified implementation of JavaScript's `Promise` built from scratch using **TypeScript**.

This project focuses on understanding how Promises work internally rather than simply using the native `Promise` API.

## Features

* Promise state management

  * `PENDING`
  * `FULFILLED`
  * `REJECTED`
* Generic success and rejection types
* Custom `resolve()` and `reject()` functions
* `.then()` support
* `.catch()` support
* `.finally()` support
* Callback queues for pending Promises
* Basic protection against multiple settlements
* Promise chaining *(planned)*

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
store value
      ↓
execute .then() callbacks
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
store reason
      ↓
execute .catch() callbacks
      ↓
execute .finally()
```

## Generic Types

The Promise implementation uses two generic types:

```ts
class MyPromise<T, K>
```

Where:

* `T` represents the type of the resolved value.
* `K` represents the type of the rejection reason.

For example:

```ts
MyPromise<number, string>
```

means:

```text
resolve → number
reject  → string
```

## Executor

The constructor accepts an executor function:

```ts
new MyPromise((resolve, reject) => {
    // asynchronous operation
});
```

Internally, the executor receives the custom resolver and rejector:

```text
executor
   │
   ├── resolve → _promiseResolver()
   │
   └── reject  → _promiseRejector()
```

The resolver and rejector are bound to the current `MyPromise` instance using `.bind(this)`.

## Callback Queues

If `.then()` or `.catch()` is called while the Promise is still pending, the callback cannot be executed immediately.

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

`.then()` is responsible for handling successful Promise completion.

If the Promise is already fulfilled:

```ts
promise.then(handler);
```

the handler is executed immediately.

If the Promise is still pending, the handler is stored and executed later when `resolve()` is called.

```text
              Promise
                 │
          ┌──────┴──────┐
          ↓             ↓
     FULFILLED        PENDING
          │             │
          ↓             ↓
      run handler    store handler
                        │
                        ↓
                    resolve()
                        │
                        ↓
                   run handler
```

## `.catch()`

`.catch()` handles rejected Promises.

If the Promise is already rejected, the callback is executed immediately.

If the Promise is pending, the callback is stored until `reject()` is called.

```text
              Promise
                 │
          ┌──────┴──────┐
          ↓             ↓
      REJECTED        PENDING
          │             │
          ↓             ↓
      run catch      store catch
                        │
                        ↓
                      reject()
                        │
                        ↓
                    run catch
```

## `.finally()`

`.finally()` is executed after the Promise settles, regardless of whether it was fulfilled or rejected.

```ts
promise.finally(() => {
    console.log("Done");
});
```

It can run after either:

```text
resolve() ──→ finally()
```

or:

```text
reject() ──→ finally()
```

## Example

```ts
const waitFor = (s: number) =>
    new MyPromise<number, number>((resolve, reject) => {
        setTimeout(() => resolve(s), s * 1000);
    });

waitFor(5)
    .then((value) => {
        console.log("Promise Resolve:", value);
    })
    .catch((reason) => {
        console.log("Rejected:", reason);
    })
    .finally(() => {
        console.log("All Good");
    });
```

After five seconds:

```text
Promise Resolve: 5
All Good
```

## Rejection Example

```ts
function customPromise() {
    return new MyPromise<string, string>((resolve, reject) => {
        reject("Okay");
    });
}

customPromise()
    .then(() => {
        console.log("Custom Done");
    })
    .catch((reason) => {
        console.log("Rejected Because:", reason);
    });
```

Output:

```text
Rejected Because: Okay
```

## Architecture

The implementation can be viewed as a small state machine:

```text
                   MyPromise
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
          resolve              reject
             ↓                   ↓
        FULFILLED             REJECTED
             │                   │
             ↓                   ↓
        _value = T           _reason = K
             │                   │
             ↓                   ↓
        .then() callbacks    .catch() callbacks
             │                   │
             └─────────┬─────────┘
                       ↓
                    .finally()
```

## Current Limitations

This is intentionally a **simplified Promise implementation** and does not completely replicate the native JavaScript Promise specification.

The biggest missing feature is **true Promise chaining**.

Currently:

```ts
.then(handler)
```

returns the same Promise:

```ts
return this;
```

Therefore, the implementation does not yet create a new Promise for every `.then()`.

A proper Promise implementation should support:

```ts
waitFor(2)
    .then((value) => {
        return value * 2;
    })
    .then((value) => {
        return value + 10;
    })
    .then((value) => {
        console.log(value);
    });
```

The expected flow is:

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
    │
    │ .then()
    ↓
Promise 4
```

Each `.then()` should return a **new Promise** whose resolved value comes from the previous callback.

## Future Improvements

* [ ] Implement true Promise chaining
* [ ] Return a new Promise from `.then()`
* [ ] Return a new Promise from `.catch()`
* [ ] Implement error propagation through the chain
* [ ] Handle callbacks that return another Promise
* [ ] Implement proper Promise resolution / thenable assimilation
* [ ] Improve `.finally()` chaining
* [ ] Support multiple `.finally()` callbacks
* [ ] Implement `MyPromise.resolve()`
* [ ] Implement `MyPromise.reject()`
* [ ] Implement `MyPromise.all()`
* [ ] Implement `MyPromise.race()`
* [ ] Implement `MyPromise.allSettled()`

## Learning Goal

The goal of this project is to understand the mechanisms behind JavaScript Promises by implementing them from scratch.

The implementation focuses on:

```text
State Management
      ↓
Asynchronous Completion
      ↓
Callback Registration
      ↓
Callback Execution
      ↓
Promise Chaining
      ↓
Error Propagation
```

Rather than treating Promises as a black box, this project explores how their core behavior can be constructed using TypeScript classes, state management, callbacks, and asynchronous execution.

## Tech Stack

* TypeScript
* JavaScript Runtime
* `setTimeout` for asynchronous examples

## Status

🚧 **Work in Progress**

The current implementation supports basic Promise states, resolution, rejection, `.then()`, `.catch()`, and `.finally()`.

True Promise chaining and complete Promise resolution behavior are planned as the next step.
