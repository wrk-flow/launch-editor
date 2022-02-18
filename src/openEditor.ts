import * as childProcess from 'child_process';
import * as path from 'path';
import { ERROR_CODE } from './enum';
import EditorError from './error';
import { isWSL, getOS } from './utils';

import getArgs from './getArgs';

// function isTerminalEditor (editor) {
//   switch (editor) {
//     case 'vim':
//     case 'emacs':
//     case 'nano':
//       return true
//   }
//   return false
// }

const openEditor = async ({
  name,
  commands,
  args = [],
  fileName,
  lineNumber,
  colNumber,
  stdout,
  log
}) => {
  return new Promise((resolve, reject) => {
    if (!commands.length) {
      const error = new EditorError(
        {
          editor: name,
          code: ERROR_CODE.UNKNOWN
        },
        'no editor available'
      );
      reject(error);
    }

    if (isWSL(fileName)) {
      fileName = path.relative('', fileName);
    }

    if (lineNumber) {
      const extraArgs = getArgs(name, fileName, lineNumber, colNumber);
      args = args.concat(extraArgs);
    } else {
      args.push(fileName);
    }

    log('openEditor:commands', commands);
    /* eslint-disable no-restricted-syntax */
    for (const command of commands) {
      try {
        let _childProcess = null;
        if (getOS() === 'windows') {
          // On Windows, launch the editor in a shell because spawn can only
          // launch .exe files.
          _childProcess = childProcess.spawnSync(
            'cmd.exe',
            ['/C', command].concat(args),
            { stdio: stdout }
          );
        } else {
          _childProcess = childProcess.spawnSync(command, args, {
            stdio: stdout
          });
        }
        if (_childProcess && _childProcess.status !== null) {
          resolve({
            success: true,
            editorBin: command,
            message: 'Successfully opened editor'
          });
          break;
        }
      } catch (e) {}
    }
    /* eslint-enable  */

    const error = new EditorError(
      {
        success: false,
        editor: name
      },
      "Can't open editor"
    );

    reject(error);
  });
};

export default openEditor;
