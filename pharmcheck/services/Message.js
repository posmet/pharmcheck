const message = (err) => {
  err = err || {};
  const name = err.name ? err.name.toLowerCase() : null;

  return {
    type: err.type || name || 'error',
    message: err.message || err || "Внутренняя ошибка сервера"
  };
};

exports.buildMessage = (err) => {
  let messages = [];
  if (Array.isArray(err)) {
    messages = err.map(e => message(e));
  } else {
    messages.push(message(err));
  }
  return {
    messages
  }
};

exports.buildSuccess = () => {
  return {success: true};
};

exports.sendMessage = (res, err, httpStatus) => {
  res.status(httpStatus || 500).json(this.buildMessage(err));
};