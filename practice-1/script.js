const MIN_LOADING_TIME = 500;
const MAX_LOADING_TIME = 2000;
const FAILURE_RATE = 0.25;

const taskGrid = document.querySelector("#task-grid");
const batchMessage = document.querySelector("#batch-message");
const batchExplanation = document.querySelector("#batch-explanation");
const runAllButton = document.querySelector("#run-all");
const runSequentialButton = document.querySelector("#run-sequential");
const compareButton = document.querySelector("#compare-modes");
const eventLoopButton = document.querySelector("#run-event-loop");
const activityDot = document.querySelector(".activity-dot");
const flowSteps = [...document.querySelectorAll(".flow-step[data-flow]")];

/**
 * Creates a task whose execution counter can only be reached through getCount,
 * run, and reset. The `executionCount` variable is retained by these functions,
 * but it is not exposed on the returned object.
 */
function createTask(name, index = taskGrid.children.length) {
  let executionCount = 0;

  const element = document.createElement("article");
  element.className = "task-card";
  element.dataset.status = "idle";
  element.innerHTML = `
    <div class="task-topline">
      <span class="task-number">TASK / ${String(index + 1).padStart(2, "0")}</span>
      <span class="status" data-status="idle">Idle</span>
    </div>
    <h3>${name}</h3>
    <div class="task-stats">
      <div class="task-stat">
        <span>Executions</span>
        <strong data-count>0</strong>
      </div>
      <div class="task-stat">
        <span>Loading time</span>
        <strong data-time>—</strong>
      </div>
    </div>
    <div class="request-progress" aria-hidden="true"><span></span></div>
    <div class="task-actions">
      <button class="run-task" type="button">▶ Run only this task</button>
      <button class="reset-task" type="button">Reset count</button>
    </div>
  `;

  taskGrid.append(element);

  const statusElement = element.querySelector(".status");
  const countElement = element.querySelector("[data-count]");
  const timeElement = element.querySelector("[data-time]");
  const runButton = element.querySelector(".run-task");
  const resetButton = element.querySelector(".reset-task");

  function setStatus(status, label) {
    element.dataset.status = status;
    statusElement.dataset.status = status;
    statusElement.textContent = label;
  }

  function setBusy(isBusy) {
    runButton.disabled = isBusy;
    resetButton.disabled = isBusy;
  }

  function run(plan = {}) {
    const loadingTime = plan.loadingTime ?? randomInteger(MIN_LOADING_TIME, MAX_LOADING_TIME);
    const shouldFail = plan.shouldFail ?? Math.random() < FAILURE_RATE;

    executionCount += 1;
    countElement.textContent = executionCount;
    timeElement.textContent = "…";
    element.style.setProperty("--loading-time", `${loadingTime}ms`);
    setStatus("loading", "Loading");
    setBusy(true);

    const startedAt = performance.now();

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const elapsed = Math.round(performance.now() - startedAt);
        timeElement.textContent = `${elapsed} ms`;
        setBusy(false);

        if (shouldFail) {
          setStatus("failed", "Failed");
          reject(new Error(`${name} failed after ${elapsed} ms`));
          return;
        }

        setStatus("completed", "Completed");
        resolve({ name, elapsed });
      }, loadingTime);
    });
  }

  function getCount() {
    return executionCount;
  }

  function reset() {
    executionCount = 0;
    countElement.textContent = executionCount;
    timeElement.textContent = "—";
    element.style.removeProperty("--loading-time");
    setStatus("idle", "Idle");
  }

  runButton.addEventListener("click", () => {
    run().catch((error) => console.warn(error.message));
  });
  resetButton.addEventListener("click", reset);

  return { name, run, getCount, reset };
}

const tasks = ["Load Users", "Load Posts", "Load Comments"].map(createTask);

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(milliseconds) {
  return `${(milliseconds / 1000).toFixed(2)} s`;
}

function createPlans({ allowFailure = true } = {}) {
  return tasks.map(() => ({
    loadingTime: randomInteger(MIN_LOADING_TIME, MAX_LOADING_TIME),
    shouldFail: allowFailure && Math.random() < FAILURE_RATE,
  }));
}

function setBatchControlsDisabled(disabled) {
  runAllButton.disabled = disabled;
  runSequentialButton.disabled = disabled;
  compareButton.disabled = disabled;
  activityDot.classList.toggle("is-active", disabled);
}

async function runConcurrently(plans = createPlans()) {
  const startedAt = performance.now();
  const results = await Promise.allSettled(
    tasks.map((task, index) => task.run(plans[index])),
  );

  return {
    elapsed: Math.round(performance.now() - startedAt),
    results,
  };
}

async function runSequentially(plans = createPlans()) {
  const startedAt = performance.now();
  const results = [];

  for (let index = 0; index < tasks.length; index += 1) {
    try {
      const value = await tasks[index].run(plans[index]);
      results.push({ status: "fulfilled", value });
    } catch (reason) {
      // A failed request is recorded, then the next task is still started.
      results.push({ status: "rejected", reason });
    }
  }

  return {
    elapsed: Math.round(performance.now() - startedAt),
    results,
  };
}

function summarizeResults(results) {
  const failed = results.filter((result) => result.status === "rejected").length;
  const completed = results.length - failed;
  return `${completed} completed, ${failed} failed`;
}

async function handleBatchRun(mode) {
  setBatchControlsDisabled(true);
  batchMessage.textContent =
    mode === "concurrent" ? "Running all tasks together…" : "Running one task at a time…";
  batchExplanation.textContent =
    mode === "concurrent"
      ? "All three cards enter Loading immediately. Total time will be close to the slowest request."
      : "Only one card enters Loading at a time. The next request starts after the previous one settles.";

  try {
    const outcome =
      mode === "concurrent" ? await runConcurrently() : await runSequentially();

    batchMessage.textContent = `All tasks finished in ${formatTime(outcome.elapsed)} · ${summarizeResults(outcome.results)}`;
    batchExplanation.textContent =
      mode === "concurrent"
        ? "Because the waits overlapped, the total is approximately the longest individual loading time."
        : "Because the waits did not overlap, the total is approximately the sum of all loading times.";
  } finally {
    setBatchControlsDisabled(false);
  }
}

runAllButton.addEventListener("click", () => handleBatchRun("concurrent"));
runSequentialButton.addEventListener("click", () => handleBatchRun("sequential"));

compareButton.addEventListener("click", async () => {
  const sequentialTime = document.querySelector("#sequential-time");
  const concurrentTime = document.querySelector("#concurrent-time");
  const sequentialMeter = document.querySelector("#sequential-meter");
  const concurrentMeter = document.querySelector("#concurrent-meter");
  const explanation = document.querySelector("#comparison-explanation");

  setBatchControlsDisabled(true);
  compareButton.textContent = "Comparing…";
  batchMessage.textContent = "Comparison in progress: sequential run first…";
  batchExplanation.textContent =
    "The same three delays are used twice, so the result compares execution strategy rather than luck.";

  // The same successful plans make this a timing comparison rather than a luck comparison.
  const plans = createPlans({ allowFailure: false });

  try {
    const sequential = await runSequentially(plans);
    batchMessage.textContent = "Sequential run complete. Starting the same tasks together…";
    const concurrent = await runConcurrently(plans);
    const longestTime = Math.max(sequential.elapsed, concurrent.elapsed);
    const savedPercent = Math.round((1 - concurrent.elapsed / sequential.elapsed) * 100);

    sequentialTime.textContent = formatTime(sequential.elapsed);
    concurrentTime.textContent = formatTime(concurrent.elapsed);
    sequentialMeter.style.width = `${(sequential.elapsed / longestTime) * 100}%`;
    concurrentMeter.style.width = `${(concurrent.elapsed / longestTime) * 100}%`;
    explanation.textContent = `Concurrent execution was ${savedPercent}% faster here. It waited roughly for the longest delay, while sequential execution waited for all three delays one after another.`;
    batchMessage.textContent = `Comparison finished · concurrent saved ${formatTime(sequential.elapsed - concurrent.elapsed)}`;
    batchExplanation.textContent =
      "Read the bars below: their lengths use the same scale, so the difference is directly comparable.";
  } finally {
    compareButton.textContent = "Compare both modes";
    setBatchControlsDisabled(false);
  }
});

function showFlowPhase(phase) {
  const order = ["stack", "microtask", "task"];
  const currentIndex = order.indexOf(phase);

  flowSteps.forEach((step) => {
    const stepIndex = order.indexOf(step.dataset.flow);
    step.classList.toggle("is-current", stepIndex === currentIndex);
    step.classList.toggle("is-done", stepIndex < currentIndex);
  });
}

function runEventLoopDemo() {
  const outputElement = document.querySelector("#actual-output");
  const explanationElement = document.querySelector("#event-explanation");
  const output = [];

  outputElement.innerHTML = "";
  eventLoopButton.disabled = true;
  showFlowPhase("stack");

  function log(message) {
    output.push(message);
    console.log(message);

    const stepNumber = Number.parseInt(message, 10);
    const phase = stepNumber <= 3 ? "stack" : stepNumber <= 6 ? "microtask" : "task";
    const item = document.createElement("li");
    item.textContent = message.replace(/^\d+\.\s*/, "");
    item.dataset.phase = phase;
    item.classList.add("is-new");
    outputElement.append(item);
    showFlowPhase(phase);
  }

  async function asyncExample() {
    log("2. async function start");
    await Promise.resolve();
    log("5. async after await");

    Promise.resolve().then(() => {
      log("6. promise callback B");
    });

    setTimeout(() => {
      log("8. timer B");
      explanationElement.textContent =
        "The call stack produced messages 1–3. Promise and await callbacks entered the microtask queue and produced 4–6. Only after that queue was empty did the event loop move timer A and timer B from the task queue onto the stack.";
      flowSteps.forEach((step) => {
        step.classList.remove("is-current");
        step.classList.add("is-done");
      });
      eventLoopButton.disabled = false;
    }, 0);
  }

  log("1. script start");

  setTimeout(() => {
    log("7. timer A");
  }, 0);

  Promise.resolve().then(() => {
    log("4. promise callback A");
  });

  asyncExample();
  log("3. script end");

  return output;
}

eventLoopButton.addEventListener("click", runEventLoopDemo);

// Expose the factory for simple exploration in DevTools without exposing counters.
window.createTask = createTask;
