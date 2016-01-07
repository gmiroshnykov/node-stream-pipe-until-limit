var assert = require('assert');
var streamBuffers = require('stream-buffers');

var streamPipeUntilLimit = require('./index');

describe('streamPipeUntilLimit', function() {
  it('should work', function(cb) {
    var input = new streamBuffers.ReadableStreamBuffer({chunkSize: 1});
    var output = new streamBuffers.WritableStreamBuffer();

    input.put('Hello World!');
    input.stop();

    streamPipeUntilLimit(input, output, 5, function(err, offset) {
      assert.ifError(err);

      assert.equal(offset, 5);
      assert.equal(output.getContentsAsString(), 'Hello');

      var rest = new streamBuffers.WritableStreamBuffer();
      input.pipe(rest).on('finish', function() {
        assert.equal(rest.getContentsAsString(), ' World!');
        cb();
      });
    });
  });

  it('should work if readable stream has exactly the needed number of bytes', function(cb) {
    var input = new streamBuffers.ReadableStreamBuffer({chunkSize: 1});
    var output = new streamBuffers.WritableStreamBuffer();

    input.put('Hello World!');
    input.stop();

    streamPipeUntilLimit(input, output, 12, function(err, offset) {
      assert.ifError(err);

      assert.equal(offset, 12);
      assert.equal(output.getContentsAsString(), 'Hello World!');

      var rest = new streamBuffers.WritableStreamBuffer();
      input.pipe(rest).on('finish', function() {
        assert.equal(rest.getContentsAsString(), false);
        cb();
      });
    });
  });

  it('should fail on size bigger than input', function(cb) {
    var input = new streamBuffers.ReadableStreamBuffer({chunkSize: 1});
    var output = new streamBuffers.WritableStreamBuffer();

    input.put('Hello World!');
    input.stop();

    streamPipeUntilLimit(input, output, 100, function(err) {
      assert(err);
      assert.equal(err.message, 'stream ended, but limit was not reached');
      cb();
    });
  });
});
