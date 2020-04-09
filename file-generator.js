'use strict';

const fsp = require('fs').promises;
const defaultOptions = {
  includeNewlines: true,
  initialBufferLength: 1024
  };

class FileGenerator {
  constructor(fileName, userOptions = {}) {
    this._options = {};
    Object.assign(this._options, defaultOptions);
    Object.assign(this._options, userOptions);

    let fileGen = this;
    if (!fileName || fileName.length == 0)
      throw new Error('Invalid file name');
    this._includeNewlines = this._options.includeNewlines ? 1 : 0;
    this._fileName = fileName;
  }

  /*
   * Yields a line at a time. A line is a string of chars ending in newline.
   *
   * Start by filling a buffer with data from the file. Search in this buffer
   * for newlines, and for each one found, yield the string. If no more newline
   * found, then copy the rest of the string to the beginning of the buffer
   * and read more. Repeat.
   *
   * If the entire buffer didn't have a newline, create a new buffer double
   * the size of the current buffer, copy existing buffer to it, and start
   * the search again.
   */
  async *genLines() {
    let fh = await fsp.open(this._fileName, 'r');
    let bufLength = this._options.initialBufferLength;
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
