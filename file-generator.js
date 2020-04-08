'use strict';

const fsp = require('fs').promises;
const defaultOptions = {
  includeNewlines: true
  };

class FileGenerator {
  constructor(fileName, options = defaultOptions) {
    let fileGen = this;
    if (!fileName || fileName.length == 0)
      throw new Error('Invalid file name');
    this._includeNewlines = options.includeNewlines ? 1 : 0;
    this._fileName = fileName;
  }

  async *genLines() {
    let fh = await fsp.open(this._fileName, 'r');
    let bufLength = 1024;
    let buffer = Buffer.alloc(bufLength);
    let bufEnd = -1;
    let lastNewlinePos;

    do {
      lastNewlinePos = -1;
      let bufAvailable = bufLength - bufEnd - 1;
      let resp = await fh.read(buffer, bufEnd + 1, bufAvailable);
      bufEnd += resp.bytesRead;
      if (resp.bytesRead == 0)
        break;

      let found = false;
      let newlinePos;
      while (true) {
        newlinePos = buffer.indexOf("\n", lastNewlinePos + 1);
        if (newlinePos > bufEnd || newlinePos == -1)
          break;
        found = true;
        yield buffer.toString('utf8', lastNewlinePos + 1, newlinePos + this._includeNewlines);
        lastNewlinePos = newlinePos;
      }

      let tempBuffer = buffer;
      if (resp.bytesRead < bufAvailable) { // we reached eof
        break;
      } else if (!found) { // we're not at eof yet. Extend the buffer
        bufLength *= 2;
        tempBuffer = Buffer.alloc(bufLength);
      }

      buffer.copy(tempBuffer, 0, lastNewlinePos + 1, bufEnd + 1);
      buffer = tempBuffer;
      bufEnd = bufEnd - lastNewlinePos - 1;
    } while (true);

    // no more bytes to read, generate last part of the string if applicable
    if (bufEnd > lastNewlinePos)
      yield buffer.toString('utf8', lastNewlinePos + 1, bufEnd + 1);

    await fh.close();
  }
}

module.exports = FileGenerator;
