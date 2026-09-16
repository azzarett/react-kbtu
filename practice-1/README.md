# Async Lab — JavaScript Runtime and Async

Async Lab is a small, dependency-free project for exploring closures, the call stack, Promises, `async`/`await`, tasks, microtasks, and the event loop.

Open `index.html` in a browser. No installation or build step is required.

## Closures and the private task counter

`createTask(name, index)` declares `executionCount` as a local variable and returns the methods `run`, `getCount`, and `reset`. Those methods keep a reference to the lexical environment in which they were created. This retained environment is a closure.

The counter is not a property of the returned task object, so other code cannot change it directly. It can only be read or changed through the returned methods. Every call to `createTask` creates a new lexical environment, which is why Load Users, Load Posts, and Load Comments each have an independent private counter.

```js
const task = createTask("Load Users", 0);
task.run();
task.getCount();
task.reset();
```

## Call stack example

When **Run all tasks** is clicked, the click handler enters the call stack and calls `handleBatchRun("concurrent")`. That function calls `runConcurrently`, which immediately calls `task.run()` for all three tasks. Each `run` creates a Promise and schedules a timer. These synchronous calls leave the stack quickly; their timer callbacks run later. When all Promises have settled, the continuation after `await Promise.allSettled(...)` is placed in the microtask queue and later returns to the call stack to update the summary.

## Why JavaScript continues while `setTimeout` waits

`setTimeout` registers a timer with the browser and returns immediately. The JavaScript thread does not wait inside the timer call. It continues running the rest of the current script. Once the delay has elapsed, the browser places the timer callback in the task queue. The event loop moves it to the call stack only when the stack is empty and all queued microtasks have run.

## Predicted and actual Event Loop output

Prediction written before running the demo:

```text
1. script start
2. async function start
3. script end
4. promise callback A
5. async after await
6. promise callback B
7. timer A
8. timer B
```

The actual output is the same. Messages 1–3 are synchronous. `Promise.resolve().then(...)` and the continuation after `await` are microtasks, so messages 4–6 run next. The two zero-delay timers are tasks and run afterward in the order in which they were registered, producing messages 7–8.

The UI records this output, and the same messages are also written to the browser console.

## Tasks and microtasks

- **Tasks** (sometimes called macrotasks) include timer callbacks and user-interface events. The event loop normally takes one task per turn.
- **Microtasks** include Promise callbacks and code that resumes after `await`. After the current stack becomes empty, JavaScript drains the entire microtask queue before taking the next task.

That priority explains why a resolved Promise normally runs before `setTimeout(callback, 0)` even when the timer was registered first.

## Multiple Promises and errors

The concurrent batch uses `Promise.allSettled`. Unlike `Promise.all`, it waits for every Promise even if one rejects. Each task updates its own status to Completed or Failed, and the batch summary is displayed only after every task has settled.

The sequential runner uses `try...catch` around each awaited task. A failure is recorded, but it does not stop the remaining tasks from running. Single-task runs attach `.catch(...)` so rejected Promises never become unhandled rejections.

## Sequential and concurrent execution

Sequential execution awaits one task before starting the next:

```js
await task1.run();
await task2.run();
await task3.run();
```

Its total duration is approximately the sum of the three loading times.

Concurrent execution starts all tasks before waiting:

```js
await Promise.allSettled([
  task1.run(),
  task2.run(),
  task3.run(),
]);
```

Its total duration is approximately the longest individual loading time. The **Run comparison** control uses the same three planned delays for both modes, measures them with `performance.now()`, and shows the time saved by concurrent execution.

## Project files

- `index.html` — semantic page structure and controls
- `styles.css` — responsive interface styling
- `script.js` — closures, Promise simulation, timing comparison, and Event Loop demo

The project uses only HTML, CSS, and vanilla JavaScript.
