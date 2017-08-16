module.exports = class StringWritableStream {
  constructor () {
    this.chunks = [];
  }

  write (buffer) {
    this.chunks.push(buffer);
  }

  end () {
    const buffer = Buffer.concat(this.chunks);
    this.str = buffer.toString();
  }

  toString() {
    return this.str;
  }
}
