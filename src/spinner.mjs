import ora from "ora";

const animeCycle = 1000;

export default function niceSpinner(text = "") {
  let startTime;
  let thisSpinner;
  function start() {
    startTime = Date.now();
    thisSpinner = ora(text).start();
  }
  function finalize(method, ...args) {
    const end = Date.now();
    if (!thisSpinner) return;
    if (end - startTime >= animeCycle) {
      thisSpinner[method](...args);
      thisSpinner = null;
    } else {
      setTimeout(() => {
        thisSpinner[method](...args);
        thisSpinner = null;
      }, animeCycle - (end - startTime));
    }
  }
  return { start, finalize };
}
