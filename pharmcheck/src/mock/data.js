export const errorFormat = function (msg) {
  return {
    messages: [
      {type: 'error', message: msg || "Внутренняя ошибка сервера"}
    ]
  }
};