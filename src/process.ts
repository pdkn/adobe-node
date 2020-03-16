import * as os from "os";
import { exec, ChildProcess, execFile, ExecException } from "child_process";
import {AdobeProcessOptions, AdobeAppProcess, AdobeAppName} from "./api";
import { existsSync } from 'fs';
import * as path from "path";

const newAdobeAppProcess = (appName: string, appPath: string, closeCallback: Function, options?: AdobeProcessOptions): AdobeAppProcess => {
  let process: ChildProcess;
  const timeoutCallback: Function = options.timeoutCallback;
  const processTimeout: number = options.timeout || 0;
  const openCmd: string = os.platform() === "win32" ? "start" : "open -a";

  const createCallback = (execTime: number) => (error: ExecException, stdout: string, stderr: string) => {
    let becauseOfTimeout: boolean = Date.now() - execTime >= processTimeout && processTimeout > 0;
    if (becauseOfTimeout && timeoutCallback) {
      timeoutCallback(error);
    } else {
      closeCallback(stdout);
    }
  };

  return {
    create:(openAppScript: string): void => {
      const execFileCallback = createCallback(Date.now());
      if(!existsSync(appPath)) {
        throw new Error('Wrong app path');
      }
      if (appName === AdobeAppName.AfterEffects) {
        const appleScript: string = path.join(__dirname, '..', 'scripts', appName, `AE-RunScript.scpt`);
        console.log(`osascript ${appleScript} "${openAppScript}"`);
        process = exec(`osascript ${appleScript} "${openAppScript}"`);
      } else {
        process = execFile(appPath, [openAppScript], { timeout: processTimeout }, execFileCallback);
      }

    },
    kill:(): void => {
      process.kill();
    },
    run:(commandPath: string): void => {
      if (appName === AdobeAppName.AfterEffects) {
        const appleScript: string = path.join(__dirname, '..', 'scripts', appName, `AE-RunScript.scpt`);
        console.log("Process.run() - ", `osascript ${appleScript} "${commandPath}"`);
        exec(`osascript ${appleScript} "${commandPath}"`);
      } else {
        exec(`${openCmd} ${appPath.replace(/ /g, "\\ ")} ${commandPath.replace(/ /g, "\\ ")}`);
      }
    }
  }
}

export default newAdobeAppProcess;
