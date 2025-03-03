/* *
 * Detect possible commands:
 * 1. The editor is specified => Still find the commands in map
 * 2. Not specified => Find process first => (find) => return commands
 * => (Not found) => Find installation path (except Windows)
 */
import * as fs from 'fs';
import * as childProcess from 'child_process';
import COMMON_EDITORS_OSX from './editorInfo/osx';
import COMMON_EDITORS_LINUX from './editorInfo/linux';
import COMMON_EDITORS_WIN from './editorInfo/windows';
import { getOS } from './utils';
import {Log} from "./types";
// import { IEditor } from './enum';

export interface IGGuessEditor {
  commands: string[];
  name: string;
  opts?: string[];
}

export default (specifiedEditor: string, log: Log): IGGuessEditor | undefined => {
  const system = getOS();

  // We can find out which editor is currently running by:
  // `ps x` on macOS and Linux
  // `Get-Process` on Windows
  try {
    if (system === 'osx') {
      if (specifiedEditor) {
        return COMMON_EDITORS_OSX.find(item => item.name === specifiedEditor);
      }
      const output = childProcess.execSync('ps -ax -o comm').toString();

      return COMMON_EDITORS_OSX.find(item => {
        const { process, location } = item;
        const processBy = process.some(p => {
          log('guessEditor:output.indexOf(p) > -1', output.indexOf(p) > -1);
          return output.indexOf(p) > -1;
        });
        if (processBy) {
          return !!processBy;
        }
        log('guessEditor: use location find');

        // via path location
        return location.some(loc => {
          const isExisted = fs.existsSync(loc);
          log('loc', loc, isExisted);
          return isExisted;
        });
      });
    }

    if (system === 'windows') {
      if (specifiedEditor) {
        return COMMON_EDITORS_WIN.find(item => item.name === specifiedEditor);
      }
      // Some processes need elevated rights to get its executable path.
      // Just filter them out upfront. This also saves 10-20ms on the command.
      const output = childProcess
        .execSync(
          'wmic process where "executablepath is not null" get executablepath'
        )
        .toString();
      const runningProcesses = output.split('\r\n');

      const windowsEditorsClone = COMMON_EDITORS_WIN;
      log('guessEditor: before windowsEditorsClone', windowsEditorsClone);

      // 通过进程找编辑器
      const processEditor = windowsEditorsClone.find((item, i) => {
        const { process, location } = item;
        const processBy = process.some(p => {
          const findRunning = runningProcesses.find(
            runProc => runProc.trim().indexOf(p) > -1
          );
          log('guessEditor: findRunning', findRunning);
          if (findRunning) {
            windowsEditorsClone[i].commands.unshift(findRunning.trim());
            return true;
          }
          return false;
        });
        log('guessEditor: processBy', processBy);
        if (processBy) {
          return !!processBy;
        }
        log('guessEditor: use location find');

        // via path location
        return location.some(loc => {
          const isExisted = fs.existsSync(loc);
          log('guessEditor: loc', loc, isExisted);
          return isExisted;
        });
      });

      log('guessEditor: after windowsEditorsClone', windowsEditorsClone);
      log('guessEditor: processEditor', processEditor);

      return processEditor;
    }

    if (system === 'linux') {
      if (specifiedEditor) {
        return COMMON_EDITORS_LINUX.find(item => item.name === specifiedEditor);
      }
      // --no-heading No header line
      // x List all processes owned by you
      // -o comm Need only names column
      const output = childProcess
        .execSync('ps x --no-heading -o comm --sort=comm')
        .toString();

      return COMMON_EDITORS_LINUX.find(item => {
        const { process, location } = item;
        const processBy = process.some(p => {
          log('guessEditor: output.indexOf(p) > -1', output.indexOf(p) > -1);
          return output.indexOf(p) > -1;
        });
        if (processBy) {
          return !!processBy;
        }
        log('guessEditor: use location find');

        // via path location
        return location.some(loc => {
          const isExisted = fs.existsSync(loc);
          log('guessEditor: loc', loc, isExisted);
          return isExisted;
        });
      });
    }
  } catch (error) {
    // Ignore...
    log('error', error);
  }

  return undefined;
};
