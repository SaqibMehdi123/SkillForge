/**
 * Central error handler (audit fix S7).
 *
 * The old version echoed raw err.message and the full stack (outside
 * production), and mapped nothing - so Mongoose CastErrors, ValidationErrors
 * and Mongo duplicate-key errors all surfaced as 500s with internals leaked
 * ("E11000 duplicate key ... { username: ... }", "media.remove is not a
 * function", Cast to ObjectId failed...).
 *
 * Now:
 *   - known error classes map to precise 4xx statuses with generic messages;
 *   - body-parser payload/syntax errors map to 413/400;
 *   - anything that still reaches 5xx answers with a generic body (no
 *     internal messages), while the stack stays server-side.
 */
module.exports = (err, req, res, next) => {
  let status = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Invalid input data';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier format';
  } else if (err.code === 11000) {
    status = 409;
    message = 'A resource with this unique value already exists';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // body-parser malformed JSON
    status = 400;
    message = 'Malformed request body';
  } else if (status >= 500) {
    // Never leak internals for server faults
    message = 'Internal server error';
  }

  const body = { message };
  if (process.env.NODE_ENV !== 'production' && status >= 500) {
    // Developer-only diagnostics; production responses stay generic.
    body.stack = err.stack;
  }

  res.status(status).json(body);
};
