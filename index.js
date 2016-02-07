function streamPipeUntilLimit(readable, writable, limit, callback) {
  var offset = 0;

  function onEnd() {
    return callback(new Error('stream ended, but limit was not reached'));
  }

  function onReadable() {
    var bytesToRead = limit - offset;
    if (bytesToRead === 0) {
      readable.removeListener('readable', onReadable);
      readable.removeListener('end', onEnd);
      return callback(null, offset + bytesToRead);
    } else if (bytesToRead < 0) {
      readable.removeListener('readable', onReadable);
      readable.removeListener('end', onEnd);
      return callback(new Error('can not read less than 0 bytes'));
    }

    if (bytesToRead > 1048576) {
      bytesToRead = 1048576;
    }

    var chunk = readable.read(bytesToRead);
    if (chunk === null) {
      return;
    }

    if (offset + chunk.length < limit)  {
      offset += chunk.length;
      var canContinue = writable.write(chunk);
      if (!canContinue) {
        readable.removeListener('readable', onReadable);
        writable.once('drain', function() {
          readable.on('readable', onReadable);
          onReadable();
        });
      }
    } else {
      readable.removeListener('readable', onReadable);
      readable.removeListener('end', onEnd);

      var bytesToPush = limit - offset;
      var chunkToPush = chunk.slice(0, bytesToPush);
      writable.write(chunkToPush);
      readable.unshift(chunk.slice(bytesToPush));
      return callback(null, offset + bytesToPush);
    }
  }

  readable.on('end', onEnd);
  readable.on('readable', onReadable);
  onReadable();
}

module.exports = streamPipeUntilLimit;
